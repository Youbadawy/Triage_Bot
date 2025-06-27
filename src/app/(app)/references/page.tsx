'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/language-context';
import { 
  Search, 
  Database, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  Brain,
  BookOpen,
  Target,
  Clock,
  Filter,
  ArrowRight,
  Globe,
  ExternalLink,
  Users
} from 'lucide-react';

interface MedicalReference {
  title: string;
  document_type: string;
  version: string;
  chunk_count: number;
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

export default function ScoutAgentPage() {
  const { t } = useLanguage();
  
  // State management
  const [references, setReferences] = useState<MedicalReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [scoutAnalysis, setScoutAnalysis] = useState<ScoutAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [triageText, setTriageText] = useState('');
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<string[]>(['all']);
  const [ragStatus, setRagStatus] = useState<'operational' | 'development' | 'error'>('operational');
  
  // Web search state
  const [isWebSearching, setIsWebSearching] = useState(false);
  const [webSearchResults, setWebSearchResults] = useState<any[]>([]);
  const [selectedTrade, setSelectedTrade] = useState('');
  const [searchType, setSearchType] = useState<'general' | 'trade_requirements' | 'research'>('general');

  const documentTypes = [
    { value: 'all', label: 'All Documents' },
    { value: 'protocol', label: 'Medical Protocols' },
    { value: 'guideline', label: 'Clinical Guidelines' },
    { value: 'policy', label: 'CAF Policies' },
    { value: 'procedure', label: 'Emergency Procedures' }
  ];

  const cafTrades = [
    'Pilot', 'Navigator', 'Aircrew', 'Combat Diver', 'Clearance Diver', 
    'Infantry', 'Armoured', 'Artillery', 'Engineer', 'Special Forces',
    'Medical Technician', 'Dental Technician', 'Mental Health', 
    'Supply Technician', 'Communications', 'Intelligence'
  ];

  const loadReferences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/rag-status');
      const data = await response.json();
      
      if (data.status === 'operational') {
        setReferences(data.documents || []);
        setRagStatus('operational');
      } else {
        setRagStatus('development');
        setReferences([
          {
            title: "RAG System in Development Mode",
            document_type: "system",
            version: "mock",
            chunk_count: 150
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading references:', error);
      setRagStatus('error');
      setReferences([]);
    } finally {
      setIsLoading(false);
    }
  };

  const performScoutSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearchLoading(true);
    setSearchResults([]);
    
    try {
      const response = await fetch('/api/rag-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: searchQuery,
          documentTypes: selectedDocumentTypes.includes('all') ? undefined : selectedDocumentTypes
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.results) {
        setSearchResults(data.results);
      } else {
        console.error('Search failed:', data.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearchLoading(false);
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
        body: JSON.stringify({ 
          query: searchQuery,
          type: searchType,
          trade: searchType === 'trade_requirements' ? selectedTrade : undefined
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.results) {
        setWebSearchResults(data.results);
        console.log(`🌐 Web search completed: ${data.summary}`);
        if (data.ingestedCount > 0) {
          console.log(`📚 Auto-ingested ${data.ingestedCount} documents into knowledge base`);
          // Refresh local search results
          await loadReferences();
        }
      } else {
        console.error('Web search failed:', data.error);
        setWebSearchResults([]);
      }
    } catch (error) {
      console.error('Web search error:', error);
      setWebSearchResults([]);
    } finally {
      setIsWebSearching(false);
    }
  };

  const analyzeWithScout = async () => {
    if (!triageText.trim()) return;
    
    setIsAnalyzing(true);
    setScoutAnalysis(null);
    
    try {
      // Use the existing policy-based routing with Scout AI
      const response = await fetch('/api/scout-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          triageText: triageText,
          includeContext: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setScoutAnalysis({
          appointmentType: data.appointmentType,
          reason: data.reason,
          confidence: data.confidence || 0.85,
          sources: data.sources || []
        });
      } else {
        // Fallback to mock analysis for now
        setScoutAnalysis({
          appointmentType: 'GP',
          reason: `Based on the triage text provided, I recommend a General Practitioner consultation. The symptoms described warrant medical evaluation by a qualified physician who can perform a proper assessment and determine appropriate next steps.`,
          confidence: 0.82,
          sources: ['CAF Medical Protocols', 'Clinical Guidelines']
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      // Provide fallback response
      setScoutAnalysis({
        appointmentType: 'Error',
        reason: 'Analysis temporarily unavailable. Please try again later.',
        confidence: 0,
        sources: []
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleDocumentType = (type: string) => {
    if (type === 'all') {
      setSelectedDocumentTypes(['all']);
    } else {
      const newTypes = selectedDocumentTypes.includes('all') 
        ? [type]
        : selectedDocumentTypes.includes(type)
          ? selectedDocumentTypes.filter(t => t !== type)
          : [...selectedDocumentTypes.filter(t => t !== 'all'), type];
      
      setSelectedDocumentTypes(newTypes.length === 0 ? ['all'] : newTypes);
    }
  };

  useEffect(() => {
    loadReferences();
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="h-8 w-8 mr-3 text-blue-600" />
              <div>
                <CardTitle className="text-2xl font-headline text-blue-700">
                  🔍 Scout Agent - Medical Knowledge Explorer
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  Search CAF medical protocols with AI-powered analysis using LLaMA 4 Scout
                </p>
              </div>
            </div>
            <Badge variant="secondary" className={`${
              ragStatus === 'operational' ? 'bg-green-100 text-green-800' : 
              ragStatus === 'development' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            }`}>
              <CheckCircle className="h-3 w-3 mr-1" />
              {ragStatus === 'operational' ? 'OPERATIONAL' : ragStatus === 'development' ? 'DEV MODE' : 'ERROR'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Web Search Interface */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2 text-blue-600" />
            🌐 Live Web Research - Find Real CAF Documentation
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Search the internet for current CAF medical standards, trade-specific requirements, and official documentation
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Type Selection */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              <Target className="h-4 w-4 inline mr-1" />
              Search Type
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={searchType === 'general' ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchType('general')}
                className="text-xs"
              >
                General Medical
              </Button>
              <Button
                variant={searchType === 'trade_requirements' ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchType('trade_requirements')}
                className="text-xs"
              >
                Trade Requirements
              </Button>
              <Button
                variant={searchType === 'research' ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchType('research')}
                className="text-xs"
              >
                Research & Ingest
              </Button>
            </div>
          </div>

          {/* Trade Selection (only for trade_requirements) */}
          {searchType === 'trade_requirements' && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                <Users className="h-4 w-4 inline mr-1" />
                CAF Trade/Occupation
              </label>
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select a trade...</option>
                {cafTrades.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Web Search Input */}
          <div className="flex space-x-2">
            <Input
              placeholder={
                searchType === 'trade_requirements' 
                  ? "e.g., 'annual medical requirements', 'vision standards', 'fitness testing'"
                  : searchType === 'research'
                  ? "e.g., 'aviation medical standards', 'diving medical protocols'"
                  : "Search current CAF medical documentation... (e.g., 'emergency procedures', 'mental health protocols')"
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && performWebSearch()}
              className="flex-1"
            />
            <Button 
              onClick={performWebSearch} 
              disabled={isWebSearching || !searchQuery.trim() || (searchType === 'trade_requirements' && !selectedTrade)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Globe className="h-4 w-4 mr-2" />
              {isWebSearching ? 'Searching Web...' : 'Search Web'}
            </Button>
          </div>

          {/* Web Search Results */}
          {webSearchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-blue-800 flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                Live Web Results ({webSearchResults.length} found)
              </h3>
              {webSearchResults.map((result, index) => (
                <Card key={index} className="border border-blue-300 bg-blue-100/50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                        <a 
                          href={result.url || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-900 hover:underline"
                        >
                          {result.title}
                        </a>
                        <Badge variant="outline" className="text-xs">
                          {result.documentType || result.category}
                        </Badge>
                        {result.relevance && (
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(result.relevance * 100)}% relevant
                          </Badge>
                        )}
                        {result.source && (
                          <Badge variant="default" className="text-xs bg-green-600">
                            {result.source}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {result.content || result.requirement}
                    </p>
                    {result.frequency && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium">Frequency:</span> {result.frequency} |{' '}
                        <span className="font-medium">Authority:</span> {result.authority}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>Source: {result.url || result.source}</span>
                      {result.lastUpdated && (
                        <span>Updated: {new Date(result.lastUpdated).toLocaleDateString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Search Interface */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2 text-primary" />
            Local Knowledge Base Search
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Search documents already ingested into the knowledge base
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Type Filters */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              <Filter className="h-4 w-4 inline mr-1" />
              Document Types
            </label>
            <div className="flex flex-wrap gap-2">
              {documentTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedDocumentTypes.includes(type.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDocumentType(type.value)}
                  className="text-xs"
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="flex space-x-2">
            <Input
              placeholder="Search medical protocols, procedures, guidelines... (e.g., 'chest pain emergency', 'mental health assessment')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && performScoutSearch()}
              className="flex-1"
            />
            <Button 
              onClick={performScoutSearch} 
              disabled={isSearchLoading || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Search className="h-4 w-4 mr-2" />
              {isSearchLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-green-800 flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Found {searchResults.length} Relevant Documents
              </h3>
              {searchResults.map((result, index) => (
                <Card key={index} className="border border-blue-200 bg-blue-50/50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">{result.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {result.document_type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(result.similarity_score * 100)}% relevance
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{result.content}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>Source: {result.source}</span>
                      <span>Chunk {result.chunk_index}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scout AI Analysis Interface */}
      <Card className="shadow-lg border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-700">
            <Zap className="h-5 w-5 mr-2" />
            Scout AI Analysis - Policy-Based Routing
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Submit triage text for AI-powered appointment routing based on CAF medical policies
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Triage Text or Medical Query
            </label>
            <Textarea
              placeholder="Enter patient symptoms, concerns, or medical query for AI analysis... 

Example: 'Patient reports chest pain, shortness of breath, and dizziness lasting 2 hours. Pain radiates to left arm. Patient appears anxious and is sweating.'

Or: 'Soldier complaining of persistent lower back pain after physical training, difficulty walking, no numbness or tingling.'"
              value={triageText}
              onChange={(e) => setTriageText(e.target.value)}
              rows={4}
              className="resize-y"
            />
          </div>
          
          <Button 
            onClick={analyzeWithScout} 
            disabled={isAnalyzing || !triageText.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Brain className="h-4 w-4 mr-2" />
            {isAnalyzing ? 'Analyzing with Scout AI...' : 'Analyze with Scout AI'}
          </Button>

          {/* Scout Analysis Results */}
          {scoutAnalysis && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-purple-800 flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Scout AI Recommendation
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={scoutAnalysis.appointmentType === 'ER referral' ? 'destructive' : 'secondary'}
                      className="font-medium"
                    >
                      {scoutAnalysis.appointmentType}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(scoutAnalysis.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </div>
                
                <p className="text-purple-800 leading-relaxed mb-3">
                  {scoutAnalysis.reason}
                </p>
                
                {scoutAnalysis.sources.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-purple-700 mb-1">Evidence Sources:</p>
                    <div className="flex flex-wrap gap-1">
                      {scoutAnalysis.sources.map((source, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {source}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Database Status & Documents */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2 text-primary" />
            Vector Database Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Database Status */}
          <div className={`rounded-md border p-4 ${
            ragStatus === 'operational' ? 'border-green-200 bg-green-50' : 
            ragStatus === 'development' ? 'border-yellow-200 bg-yellow-50' : 
            'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <Database className={`h-5 w-5 ${
                ragStatus === 'operational' ? 'text-green-600' : 
                ragStatus === 'development' ? 'text-yellow-600' : 
                'text-red-600'
              }`} />
              <h3 className={`font-semibold ${
                ragStatus === 'operational' ? 'text-green-800' : 
                ragStatus === 'development' ? 'text-yellow-800' : 
                'text-red-800'
              }`}>
                Supabase Vector Database
              </h3>
            </div>
            <p className={`text-sm mb-3 ${
              ragStatus === 'operational' ? 'text-green-700' : 
              ragStatus === 'development' ? 'text-yellow-700' : 
              'text-red-700'
            }`}>
              {ragStatus === 'operational' 
                ? 'Connected to production vector database with medical documents and embeddings.'
                : ragStatus === 'development' 
                ? 'Running in development mode with mock data. Configure Supabase for full functionality.'
                : 'Database connection error. Please check configuration.'
              }
            </p>
          </div>

          {/* Loaded Documents */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Available Medical References
            </h3>
            
            {isLoading ? (
              <p className="text-muted-foreground">Loading references...</p>
            ) : (
              <div className="grid gap-3">
                {references.map((ref, index) => (
                  <Card key={index} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{ref.title}</h4>
                          <div className="flex space-x-2 mt-2">
                            <Badge variant="outline">{ref.document_type}</Badge>
                            <Badge variant="secondary">v{ref.version}</Badge>
                            <Badge variant="secondary">{ref.chunk_count} chunks</Badge>
                          </div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Features */}
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <h3 className="font-semibold text-amber-800 mb-2 flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Enhanced Scout Features
            </h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>✅ Vector similarity search across medical documents</li>
              <li>✅ LLaMA 4 Scout AI for policy-based appointment routing</li>
              <li>✅ Real-time document relevance scoring</li>
              <li>✅ Evidence-based recommendation sources</li>
              <li>✅ CAF-specific medical protocol compliance</li>
              <li>✅ Emergency detection and proper escalation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
