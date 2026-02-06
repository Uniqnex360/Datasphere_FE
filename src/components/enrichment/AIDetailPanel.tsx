  // import React, { useState, useEffect } from 'react';
  // import { X, Sparkles, TrendingUp, History, RefreshCw } from 'lucide-react';
  // import { supabase } from '../../lib/supabase';
  // import { AISuggestionCard } from './AISuggestionCard';
  // import { AIActionPanel } from './AIActionPanel';
  // import { EnrichmentStatusBadge } from './EnrichmentStatusBadge';
  // import { ApprovalPanel } from './ApprovalPanel';
  // import { EnrichmentAPI } from '../../lib/api';

  // interface AIDetailPanelProps {
  //   productId: string;
  //   productName: string;
  //   isOpen: boolean;
  //   onClose: () => void;
  //   onRefresh?: () => void;
  // }

  // interface AISuggestion {
  //   id: string;
  //   product_id: string;
  //   field_name: string;
  //   current_value?: string;
  //   suggested_value: string;
  //   confidence_score: number;
  //   status: string;
  //   reason?: string;
  //   ai_model?: string;
  //   created_at: string;
  // }

  // interface EnrichmentStatus {
  //   enrichment_status: string;
  //   completeness_score: number;
  //   ai_enriched_fields: string[];
  //   missing_fields: string[];
  //   last_enriched_at?: string;
  //   last_normalized_at?: string;
  // }

  // export function AIDetailPanel({ productId, productName, isOpen, onClose, onRefresh }: AIDetailPanelProps) {
  //   const [activeTab, setActiveTab] = useState<'suggestions' | 'status' | 'history'>('suggestions');
  //   const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  //   const [toast, setToast] = useState<{message: string;type: 'success' | 'error';} | null>(null);
  //   const [enrichmentStatus, setEnrichmentStatus] = useState<EnrichmentStatus | null>(null);
  //   const [history, setHistory] = useState<any[]>([]);
  //   const [isLoading, setIsLoading] = useState(false);
  //   const [isProcessing, setIsProcessing] = useState(false);
  //   useEffect(() => {
  //     if (isOpen && productId) {
  //       loadData();
  //     }
  //   }, [isOpen, productId, activeTab]);

  //   const loadData = async () => {
  //     setIsLoading(true);
  //     try {
  //       if (activeTab === 'suggestions') {
  //         const data=await EnrichmentAPI.getSuggestions(productId)
  //           setSuggestions(data||[])
  //       } else if (activeTab === 'status') {
  //         const data=await EnrichmentAPI.getStatus(productId)
  //         setEnrichmentStatus(data||[])
  //       } else if (activeTab === 'history') {
  //         const data=await EnrichmentAPI.getHistory(productId)
  //         setHistory(data||[])
  //       }
  //     } catch (error) {
  //       console.error('Error loading data:', error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   const loadSuggestions = async () => {
  //     const { data, error } = await supabase
  //       .from('ai_suggestions')
  //       .select('*')
  //       .eq('product_id', productId)
  //       .eq('status', 'pending')
  //       .order('confidence_score', { ascending: false });

  //     if (error) {
  //       console.error('Error loading suggestions:', error);
  //     } else {
  //       setSuggestions(data || []);
  //     }
  //   };

  //   const loadEnrichmentStatus = async () => {
  //     const { data, error } = await supabase
  //       .from('product_enrichment_status')
  //       .select('*')
  //       .eq('product_id', productId)
  //       .maybeSingle();

  //     if (error) {
  //       console.error('Error loading status:', error);
  //     } else {
  //       setEnrichmentStatus(data);
  //     }
  //   };

  //   const loadHistory = async () => {
  //     const { data, error } = await supabase
  //       .from('ai_field_history')
  //       .select('*')
  //       .eq('product_id', productId)
  //       .order('created_at', { ascending: false })
  //       .limit(50);

  //     if (error) {
  //       console.error('Error loading history:', error);
  //     } else {
  //       setHistory(data || []);
  //     }
  //   };

  //   const handleAcceptSuggestion = async (suggestionId: string) => {
  //     // const suggestion = suggestions.find((s) => s.id === suggestionId);
  //     // if (!suggestion) return;
      

  //     try {
  //       await EnrichmentAPI.approve(suggestionId)
  //       await loadData()
  //       onRefresh?.()
  //       // await supabase
  //       //   .from('ai_suggestions')
  //       //   .update({
  //       //     status: 'accepted',
  //       //     accepted_at: new Date().toISOString(),
  //       //   })
  //       //   .eq('id', suggestionId);

  //       // await supabase.from('ai_field_history').insert({
  //       //   product_id: productId,
  //       //   field_name: suggestion.field_name,
  //       //   old_value: suggestion.current_value,
  //       //   new_value: suggestion.suggested_value,
  //       //   change_type: 'ai_accepted',
  //       //   suggestion_id: suggestionId,
  //       // });

  //       // const isExternalSku = !suggestion.field_name.includes('_');

  //       // if (isExternalSku) {
  //       //   const { data: externalSku } = await supabase
  //       //     .from('external_skus')
  //       //     .select('enriched_data')
  //       //     .eq('external_sku', productId)
  //       //     .maybeSingle();

  //       //   if (externalSku) {
  //       //     const enrichedData = externalSku.enriched_data || {};
  //       //     enrichedData[suggestion.field_name] = suggestion.suggested_value;

  //       //     await supabase
  //       //       .from('external_skus')
  //       //       .update({ enriched_data: enrichedData })
  //       //       .eq('external_sku', productId);
  //       //   }
  //       // } else {
  //       //   await supabase
  //       //     .from('product_master')
  //       //     .update({ [suggestion.field_name]: suggestion.suggested_value })
  //       //     .eq('product_code', productId);
  //       // }

  //       // await loadSuggestions();
  //       // onRefresh?.();
  //     } catch (error) {
  //       console.error('Error accepting suggestion:', error);
  //       alert('Failed to accept suggestion');
  //     }
  //   };

  //   const handleRejectSuggestion = async (suggestionId: string) => {
  //     try {
  //       await EnrichmentAPI.reject(suggestionId,)
  //       await loadData()
  //       // await supabase
  //       //   .from('ai_suggestions')
  //       //   .update({ status: 'rejected' })
  //       //   .eq('id', suggestionId);

  //       // await loadSuggestions();
  //     } catch (error) {
  //       console.error('Error rejecting suggestion:', error);
  //     }
  //   };

  //   const handleEditSuggestion = async (suggestionId: string, newValue: string) => {
  //     // const suggestion = suggestions.find((s) => s.id === suggestionId);
  //     // if (!suggestion) return;

  //     try {
  //       await EnrichmentAPI.override(suggestionId,newValue)
  //       await loadData()
  //       // await supabase
  //       //   .from('ai_suggestions')
  //       //   .update({
  //       //     suggested_value: newValue,
  //       //     status: 'edited',
  //       //   })
  //       //   .eq('id', suggestionId);

  //       // await loadSuggestions();
  //     } catch (error) {
  //       console.error('Error editing suggestion:', error);
  //     }
  //   };

  //   const handleAIOperation = async (operation: string) => {
  //     setIsProcessing(true);
  //     try {
  //       // const functionMap: Record<string, string> = {
  //       //   enrich: 'ai-enrich',
  //       //   normalize: 'ai-normalize',
  //       //   missing: 'ai-missing-fields',
  //       //   score: 'ai-completeness-score',
  //       //   imageTag: 'ai-image-tag',
  //       // };
  //       if(operation==='enrich')
  //       {
  //         await EnrichmentAPI.enrich(productId)
  //         const message=`Enrichment started! Check back in a few seconds.`
  //         setToast({message,type:'success'})
  //       }
  //       // const functionName = functionMap[operation];

  //       // let body: any = { product_id: productId };
  //       // if (operation === 'imageTag') {
  //       //   const { data: product } = await supabase
  //       //     .from('product_master')
  //       //     .select('image_url_1')
  //       //     .eq('product_code', productId)
  //       //     .maybeSingle();

  //       //   if (!product) {
  //       //     const { data: externalSku } = await supabase
  //       //       .from('external_skus')
  //       //       .select('image_urls')
  //       //       .eq('external_sku', productId)
  //       //       .maybeSingle();

  //       //     if (externalSku?.image_urls && externalSku.image_urls.length > 0) {
  //       //       body.image_url = externalSku.image_urls[0];
  //       //     } else {
  //       //       alert('No image found for this product');
  //       //       setIsProcessing(false);
  //       //       return;
  //       //     }
  //       //   } else if (product.image_url_1) {
  //       //     body.image_url = product.image_url_1;
  //       //   } else {
  //       //     alert('No image found for this product');
  //       //     setIsProcessing(false);
  //       //     return;
  //       //   }
  //       // }

  //       // const response = await fetch(
  //       //   `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
  //       //   {
  //       //     method: 'POST',
  //       //     headers: {
  //       //       'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  //       //       'Content-Type': 'application/json',
  //       //     },
  //       //     body: JSON.stringify(body),
  //       //   }
  //       // );

  //       // if (response.ok) {
  //       //   const result = await response.json();
  //       //   console.log('AI operation result:', result);
  //       //   await loadSuggestions();
  //       //   await loadEnrichmentStatus();
  //       //   onRefresh?.();
  //       //   alert(`${operation} completed successfully!`);
  //       await loadData()
  //       onRefresh?.()
  //     } catch (error) {
  //       console.error('AI operation error:', error);
  //       alert(`AI operation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  //     } finally {
  //       setIsProcessing(false);
  //     }
  //   };

  //   if (!isOpen) return null;

  //   return (
  //     <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
  //       <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
  //         <div>
  //           <h2 className="text-lg font-semibold">{productName}</h2>
  //           <p className="text-sm text-blue-100">Product ID: {productId}</p>
  //         </div>
  //         <button
  //           onClick={onClose}
  //           className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
  //         >
  //           <X className="w-5 h-5" />
  //         </button>
  //       </div>

  //       <div className="border-b border-gray-200 bg-gray-50">
  //         <div className="flex">
  //           <button
  //             onClick={() => setActiveTab('suggestions')}
  //             className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
  //               activeTab === 'suggestions'
  //                 ? 'bg-white text-blue-600 border-b-2 border-blue-600'
  //                 : 'text-gray-600 hover:text-gray-800'
  //             }`}
  //           >
  //             <div className="flex items-center justify-center gap-2">
  //               <Sparkles className="w-4 h-4" />
  //               Suggestions
  //               {suggestions.length > 0 && (
  //                 <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
  //                   {suggestions.length}
  //                 </span>
  //               )}
  //             </div>
  //           </button>
  //           <button
  //             onClick={() => setActiveTab('status')}
  //             className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
  //               activeTab === 'status'
  //                 ? 'bg-white text-blue-600 border-b-2 border-blue-600'
  //                 : 'text-gray-600 hover:text-gray-800'
  //             }`}
  //           >
  //             <div className="flex items-center justify-center gap-2">
  //               <TrendingUp className="w-4 h-4" />
  //               Status
  //             </div>
  //           </button>
  //           <button
  //             onClick={() => setActiveTab('history')}
  //             className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
  //               activeTab === 'history'
  //                 ? 'bg-white text-blue-600 border-b-2 border-blue-600'
  //                 : 'text-gray-600 hover:text-gray-800'
  //             }`}
  //           >
  //             <div className="flex items-center justify-center gap-2">
  //               <History className="w-4 h-4" />
  //               History
  //             </div>
  //           </button>
  //         </div>
  //       </div>

  //       <div className="flex-1 overflow-y-auto p-6">
  //         {activeTab === 'suggestions' && (
  //           <div className="space-y-4">
  //             <ApprovalPanel
  //               productId={productId}
  //               suggestions={suggestions}
  //               onApprove={() => {
  //                 loadSuggestions();
  //                 loadEnrichmentStatus();
  //                 onRefresh?.();
  //               }}
  //               onReject={() => {
  //                 loadSuggestions();
  //                 loadEnrichmentStatus();
  //                 onRefresh?.();
  //               }}
  //             />

  //             <AIActionPanel
  //               productId={productId}
  //               isLoading={isProcessing}
  //               onEnrich={() => handleAIOperation('enrich')}
  //               onNormalize={() => handleAIOperation('normalize')}
  //               onMissingFields={() => handleAIOperation('missing')}
  //               onCompletenessScore={() => handleAIOperation('score')}
  //               onImageTag={() => handleAIOperation('imageTag')}
  //             />

  //             {isLoading ? (
  //               <div className="flex items-center justify-center py-8">
  //                 <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
  //               </div>
  //             ) : suggestions.length === 0 ? (
  //               <div className="text-center py-12 text-gray-500">
  //                 <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
  //                 <p>No pending AI suggestions</p>
  //                 <p className="text-sm mt-1">Run an AI operation to generate suggestions</p>
  //               </div>
  //             ) : (
  //               <div className="space-y-3">
  //                 <h3 className="text-sm font-semibold text-gray-700 mb-2">
  //                   Pending Suggestions ({suggestions.length})
  //                 </h3>
  //                 {suggestions.map((suggestion) => (
  //                   <AISuggestionCard
  //                     key={suggestion.id}
  //                     suggestion={suggestion}
  //                     onAccept={handleAcceptSuggestion}
  //                     onReject={handleRejectSuggestion}
  //                     onEdit={handleEditSuggestion}
  //                   />
  //                 ))}
  //               </div>
  //             )}
  //           </div>
  //         )}
          
  //         {activeTab === 'status' && (
  //   <div className="space-y-4">
  //     {enrichmentStatus ? (
  //       <>
  //         <div className="bg-white border border-gray-200 rounded-lg p-4">
  //           <h3 className="text-sm font-semibold text-gray-700 mb-3">Enrichment Status</h3>
  //           <EnrichmentStatusBadge
  //             status={enrichmentStatus.enrichment_status as any}
  //             completenessScore={enrichmentStatus.completeness_score}
  //           />

  //           <div className="mt-4 space-y-3">
  //             <div>
  //               <p className="text-xs text-gray-500 mb-1">AI Enriched Fields</p>
  //               <div className="flex flex-wrap gap-1">
  //                 {/* FIX: Add null check for ai_enriched_fields */}
  //                 {enrichmentStatus.ai_enriched_fields && enrichmentStatus.ai_enriched_fields.map((field) => (
  //                   <span
  //                     key={field}
  //                     className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded"
  //                   >
  //                     {field}
  //                   </span>
  //                 ))}
  //                 {(!enrichmentStatus.ai_enriched_fields || enrichmentStatus.ai_enriched_fields.length === 0) && (
  //                   <span className="text-sm text-gray-400">None yet</span>
  //                 )}
  //               </div>
  //             </div>

  //             {/* FIX: Add null check for missing_fields */}
  //             {enrichmentStatus.missing_fields && enrichmentStatus.missing_fields.length > 0 && (
  //               <div>
  //                 <p className="text-xs text-gray-500 mb-1">Missing Fields</p>
  //                 <div className="flex flex-wrap gap-1">
  //                   {enrichmentStatus.missing_fields.map((field) => (
  //                     <span
  //                       key={field}
  //                       className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded"
  //                     >
  //                       {field}
  //                     </span>
  //                   ))}
  //                 </div>
  //               </div>
  //             )}

  //             {enrichmentStatus.last_enriched_at && (
  //               <div>
  //                 <p className="text-xs text-gray-500">Last Enriched</p>
  //                 <p className="text-sm text-gray-700">
  //                   {new Date(enrichmentStatus.last_enriched_at).toLocaleString()}
  //                 </p>
  //               </div>
  //             )}
  //           </div>
  //         </div>

  //         <AIActionPanel
  //           productId={productId}
  //           isLoading={isProcessing}
  //           onEnrich={() => handleAIOperation('enrich')}
  //           onNormalize={() => handleAIOperation('normalize')}
  //           onMissingFields={() => handleAIOperation('missing')}
  //           onCompletenessScore={() => handleAIOperation('score')}
  //           onImageTag={() => handleAIOperation('imageTag')}
  //         />
  //       </>
  //     ) : (
  //       <div className="text-center py-12 text-gray-500">
  //         <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
  //         <p>No enrichment status available</p>
  //         <p className="text-sm mt-1">Run an AI operation to generate status</p>
  //       </div>
  //     )}
  //   </div>
  // )}

  //         {activeTab === 'history' && (
  //           <div className="space-y-3">
  //             {history.length === 0 ? (
  //               <div className="text-center py-12 text-gray-500">
  //                 <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
  //                 <p>No history available</p>
  //               </div>
  //             ) : (
  //               <>
  //                 <h3 className="text-sm font-semibold text-gray-700 mb-2">Change History</h3>
  //                 {history.map((item) => (
  //                   <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3">
  //                     <div className="flex items-start justify-between mb-2">
  //                       <span className="text-sm font-medium text-gray-700">{item.field_name}</span>
  //                       <span className="text-xs text-gray-500">
  //                         {new Date(item.created_at).toLocaleString()}
  //                       </span>
  //                     </div>
  //                     <div className="text-xs space-y-1">
  //                       {item.old_value && (
  //                         <p className="text-gray-500">
  //                           <span className="font-medium">Old:</span> <span className="line-through">{item.old_value}</span>
  //                         </p>
  //                       )}
  //                       <p className="text-green-700">
  //                         <span className="font-medium">New:</span> {item.new_value}
  //                       </p>
  //                       <p className="text-gray-500">
  //                         <span className="font-medium">Type:</span> {item.change_type}
  //                       </p>
  //                     </div>
  //                   </div>
  //                 ))}
  //               </>
  //             )}
  //           </div>
  //         )}
  //       </div>
  //     </div>
  //   );
  // }