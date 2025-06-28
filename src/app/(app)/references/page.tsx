'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Database, 
  FileText, 
  CheckCircle, 
  Zap, 
  Brain,
  BookOpen,
  Target,
  Filter,
  ArrowRight,
  Globe,
  ExternalLink,
  Users
} from 'lucide-react';

interface MedicalReference {
  id: string;
  title: string;
  document_type: string;
  version: string;
  chunk_count: number;
  created_at: string;
}

interface SearchResult {
  content: string;
  title: string;
  document_type: string;
  similarity_score: number;
  chunk_index: number;
  source: string;
}

interface ScoutAnalysis {
  appointmentType: string;
  reason: string;
  confidence: number;
  sources: string[];
}

export default function ReferencesPage() {
  const [references, setReferences] = useState<MedicalReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [triageText, setTriageText] = useState('');
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<string[]>(['all']);
  const [ragStatus, setRagStatus] = useState<'operational' | 'development' | 'error'>('operational');
  
  const [isWebSearching, setIsWebSearching] = useState(false);
  const [webSearchResults, setWebSearchResults] = useState<any[]>([]);
  const [totalDocuments, setTotalDocuments] = useState(0);

  const loadReferences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/rag-status');
      const data = await response.json();
      
      if (data.status === 'operational') {
        setReferences(data.documents || []);
        setTotalDocuments(data.totalDocuments || 0);
        setRagStatus('operational');
      } else {
        setRagStatus('development');
        setReferences([]);
      }
    } catch (error) {
      console.error('Error loading references:', error);
      setRagStatus('error');
      setReferences([]);
    } finally {
      setIsLoading(false);
    }
  };

  const performWebSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsWebSearching(true);
    setWebSearchResults([]);
    
    try {
      const response = await fetch('/api/web-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery })
      });
      
      const data = await response.json();
      
      if (response.ok && data.results) {
        setWebSearchResults(data.results);
      } else {
        setWebSearchResults([]);
      }
    } catch (error) {
      console.error('Web search error:', error);
      setWebSearchResults([]);
    } finally {
      setIsWebSearching(false);
    }
  };

  useEffect(() => {
    loadReferences();
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-600" />
              Live Web Research - Find CAF Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Search the web for CAF medical standards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && performWebSearch()}
                className="flex-1"
              />
              <Button 
                onClick={performWebSearch} 
                disabled={isWebSearching || !searchQuery.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Globe className="h-4 w-4 mr-2" />
                {isWebSearching ? 'Searching...' : 'Search Web'}
              </Button>
            </div>

            {webSearchResults.length > 0 && (
              <div className="space-y-3 pt-4">
                <h3 className="font-semibold text-blue-800">Web Results</h3>
                {webSearchResults.map((result, index) => (
                  <Card key={index} className="border-blue-300 bg-blue-100/50">
                    <CardContent className="p-4">
                       <a href={result.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-900 hover:underline">{result.title}</a>
                       <p className="text-sm text-gray-700 mt-2">{result.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available References Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
               <Database className="mr-2 h-5 w-5" />
               Available References in Knowledge Base ({totalDocuments} documents)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading references...</p>
            ) : (
              <div className="space-y-2">
                {references.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
                    <div className="flex items-center">
                      <FileText className="mr-3 h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Type: {doc.document_type} | Version: {doc.version} | Chunks: {doc.chunk_count}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{new Date(doc.created_at).toLocaleDateString()}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
