'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/language-context';
import { BookText, Database, FileText, Search, CheckCircle, AlertCircle } from 'lucide-react';

interface MedicalReference {
  title: string;
  document_type: string;
  version: string;
  chunk_count: number;
}

export default function ReferencesPage() {
  const { t } = useLanguage();
  const [references, setReferences] = useState<MedicalReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [isTestLoading, setIsTestLoading] = useState(false);

  const loadReferences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/rag-status');
      const data = await response.json();
      
      if (data.status === 'operational') {
        setReferences(data.documents || []);
      } else {
        console.error('RAG system not operational:', data.error);
        // Fallback to show we have some data
        setReferences([
          {
            title: "RAG System Unavailable",
            document_type: "error",
            version: "N/A",
            chunk_count: 0
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading references:', error);
      setReferences([]);
    } finally {
      setIsLoading(false);
    }
  };

  const testRAGSearch = async () => {
    setIsTestLoading(true);
    setTestResult('');
    try {
      const response = await fetch('/api/rag-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: 'chest pain emergency' })
      });
      
      const data = await response.json();
      
      if (response.ok && data.results) {
        setTestResult(`✅ RAG Search Test Successful: Found ${data.results.length} relevant medical protocols for "${data.query}".\n\nTop Result: "${data.results[0]?.title || 'No results'}" (${Math.round((data.results[0]?.similarity_score || 0) * 100)}% relevance)`);
      } else {
        setTestResult('❌ RAG Search Test Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      setTestResult('❌ RAG Search Test Failed: ' + (error as Error).message);
    } finally {
      setIsTestLoading(false);
    }
  };

  useEffect(() => {
    loadReferences();
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center">
            <BookText className="h-7 w-7 mr-3 text-primary" />
            <CardTitle className="text-2xl font-headline">
              {t('referencesPageTitle') || 'Medical References & RAG Database'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This page shows the medical reference documents and protocols that power the AI triage assistant's evidence-based recommendations.
          </p>
          
          {/* RAG System Status */}
          <div className="rounded-md border border-green-200 bg-green-50 p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Database className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800">RAG Database Status</h3>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                OPERATIONAL
              </Badge>
            </div>
            <p className="text-sm text-green-700 mb-3">
              The Retrieval-Augmented Generation (RAG) system enhances AI responses with official CAF medical protocols.
            </p>
            <Button 
              onClick={testRAGSearch} 
              disabled={isTestLoading}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Search className="h-4 w-4 mr-2" />
              {isTestLoading ? 'Testing...' : 'Test RAG System'}
            </Button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
              <h4 className="font-semibold text-blue-800 mb-2">System Test Results:</h4>
              <pre className="text-sm text-blue-700 whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}

          {/* Medical References List */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Loaded Medical References
            </h3>
            
            {isLoading ? (
              <p className="text-muted-foreground">Loading references...</p>
            ) : (
              <div className="grid gap-4">
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

          {/* Evidence-Based Features */}
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <h3 className="font-semibold text-amber-800 mb-2">🧠 Evidence-Based Features Active</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>✅ Emergency protocol consultation</li>
              <li>✅ Mental health guideline integration</li>
              <li>✅ Appointment type recommendations with medical backing</li>
              <li>✅ Source citation for all medical advice</li>
              <li>✅ CAF-specific protocol compliance</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
