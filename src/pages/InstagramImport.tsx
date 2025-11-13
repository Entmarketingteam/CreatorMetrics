import { useState } from 'react';
import { Upload, Instagram, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ImportResult {
  success: boolean;
  postsImported: number;
  errors: string[];
}

export default function InstagramImport() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const parseCSV = (text: string): any[] => {
    // Remove BOM if present
    const cleanText = text.replace(/^\uFEFF/, '');
    
    // Parse CSV properly handling newlines inside quoted fields
    const result: any[] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    let headers: string[] = [];
    
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];
      
      if (char === '"') {
        // Handle escaped quotes ("")
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of cell - preserve content as-is (don't trim)
        currentRow.push(currentCell);
        currentCell = '';
      } else if (char === '\n' && !inQuotes) {
        // End of row
        if (currentCell || currentRow.length > 0) {
          currentRow.push(currentCell);
          
          if (headers.length === 0) {
            // First row is headers - trim to remove any trailing CR
            headers = currentRow.map(h => h.trim());
          } else if (currentRow.length > 0 && currentRow.some(cell => cell)) {
            // Create row object
            const rowObj: any = {};
            headers.forEach((header, index) => {
              rowObj[header] = currentRow[index] || '';
            });
            result.push(rowObj);
          }
          
          currentRow = [];
          currentCell = '';
        }
      } else if (char === '\r') {
        // Skip carriage returns
        continue;
      } else {
        currentCell += char;
      }
    }
    
    // Handle last row if file doesn't end with newline
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell);
      if (headers.length > 0 && currentRow.length > 0 && currentRow.some(cell => cell)) {
        const rowObj: any = {};
        headers.forEach((header, index) => {
          rowObj[header] = currentRow[index] || '';
        });
        result.push(rowObj);
      }
    }
    
    return result;
  };

  const parsePostType = (postType: string): string => {
    const normalized = postType.trim().toLowerCase();
    if (normalized.includes('reel')) return 'REEL';
    if (normalized.includes('story')) return 'STORY';
    if (normalized.includes('carousel')) return 'POST';
    return 'POST';
  };

  const parsePublishTime = (publishTime: string): string => {
    try {
      // Meta Business Suite format: "MM/DD/YYYY HH:mm" (24-hour, no timezone)
      // Also handles: "MM/DD/YYYY h:mm AM/PM" and timezone suffixes if present
      
      // Normalize whitespace and remove timezone suffixes (if any)
      const normalized = publishTime.trim()
        .replace(/\s+/g, ' ')                                          // Normalize multi-spaces
        .replace(/\s+(GMT|UTC)[\s+-]*\d{1,4}(:\d{2})?.*$/i, '')       // Remove timezone (e.g., GMT-0400, UTC+02:00)
        .trim();
      
      const parts = normalized.split(' ');
      if (parts.length < 2) {
        return new Date().toISOString();
      }
      
      const datePart = parts[0];
      const timePart = parts[1];
      const meridian = parts[2]?.toUpperCase(); // AM or PM (optional)
      
      const [month, day, year] = datePart.split('/');
      const timeParts = timePart.split(':');
      let hours = parseInt(timeParts[0]);
      const minutes = timeParts[1] || '00';
      
      // Handle AM/PM conversion to 24-hour time (if meridian present)
      if (meridian === 'AM' || meridian === 'PM') {
        if (meridian === 'AM' && hours === 12) {
          hours = 0; // 12 AM → midnight
        } else if (meridian === 'PM' && hours !== 12) {
          hours += 12; // 1-11 PM → add 12
        }
      }
      
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}:00Z`;
    } catch {
      return new Date().toISOString();
    }
  };

  const calculateEngagementRate = (likes: number, comments: number, saves: number, shares: number, reach: number): number => {
    if (reach === 0) return 0;
    const totalEngagement = likes + comments + saves + shares;
    return (totalEngagement / reach) * 100;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file || !user) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      const postsData: any[] = [];
      const errors: string[] = [];

      for (const row of rows) {
        try {
          // Skip rows without required fields
          if (!row['Post ID'] || !row['Publish time']) {
            continue;
          }

          // Sanitize numeric inputs: Meta CSVs use plain integers, but handle locales for robustness
          const sanitizeMetric = (value: string): number => {
            const trimmed = (value || '').trim();
            if (!trimmed) return 0;
            
            // Remove all whitespace (spaces, NBSP)
            let cleaned = trimmed.replace(/\s/g, '').replace(/\u00A0/g, '');
            
            // Handle locale number formats:
            // Detect if comma is decimal (European: "1.234,56") vs thousands (US: "1,234.56")
            const hasCommaAndDot = /,.*\./.test(cleaned);  // "1,234.56" → comma is thousands
            const hasDotAndComma = /\..*,/.test(cleaned);  // "1.234,56" → comma is decimal
            
            if (hasDotAndComma) {
              // European: "1.234,56" → remove thousand dots, convert decimal comma to dot
              cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            } else if (hasCommaAndDot) {
              // US: "1,234.56" → remove thousand commas
              cleaned = cleaned.replace(/,/g, '');
            } else if (cleaned.includes(',')) {
              // Ambiguous single comma: check position to determine if decimal or thousand
              const parts = cleaned.split(',');
              if (parts[0].length > 3 || (parts[1] && parts[1].length === 2)) {
                // "1234,56" or "123,56" → likely decimal
                cleaned = cleaned.replace(',', '.');
              } else {
                // "1,234" → likely thousand
                cleaned = cleaned.replace(/,/g, '');
              }
            }
            
            const parsed = parseFloat(cleaned || '0');
            return Math.round(parsed) || 0;
          };

          const views = sanitizeMetric(row.Views);
          const reach = sanitizeMetric(row.Reach);
          const likes = sanitizeMetric(row.Likes);
          const comments = sanitizeMetric(row.Comments);
          const saves = sanitizeMetric(row.Saves);
          const shares = sanitizeMetric(row.Shares);

          // Use reach for engagement calculation, fallback to views if reach is 0
          const engagementRate = calculateEngagementRate(likes, comments, saves, shares, reach > 0 ? reach : views);

          postsData.push({
            user_id: user.id,
            platform: 'INSTAGRAM',
            post_type: parsePostType(row['Post type'] || 'POST'),
            posted_at: parsePublishTime(row['Publish time']),
            caption: row.Description || '',
            thumbnail_url: row.Permalink || null, // Store permalink for reference
            external_post_id: row['Post ID'], // Instagram's unique post identifier
            views: views,
            reach: reach,
            likes: likes,
            comments: comments,
            shares: shares,
            saves: saves,
            engagement_rate: engagementRate,
            attributed_revenue: 0,
            attributed_sales: 0,
          });
        } catch (err: any) {
          errors.push(`Error parsing row: ${err.message}`);
        }
      }

      // Insert posts in batches
      let postsImported = 0;
      const batchSize = 50;

      for (let i = 0; i < postsData.length; i += batchSize) {
        const batch = postsData.slice(i, i + batchSize);
        const { error } = await supabase
          .from('social_posts')
          .upsert(batch, {
            onConflict: 'user_id,platform,external_post_id',
            ignoreDuplicates: false
          });

        if (error) {
          errors.push(`Database error: ${error.message}`);
          break;
        }

        postsImported += batch.length;
      }

      setResult({
        success: errors.length === 0,
        postsImported,
        errors,
      });
    } catch (err: any) {
      setResult({
        success: false,
        postsImported: 0,
        errors: [err.message || 'Unknown error occurred'],
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h1 font-bold text-foreground">Instagram Import</h1>
        <p className="text-body text-muted-foreground mt-1">
          Import Instagram posts from Meta Business Suite exports
        </p>
      </div>

      {/* Instructions Card */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-h3 font-semibold text-foreground mb-4">How to Export from Meta Business Suite</h2>
        <ol className="list-decimal list-inside space-y-2 text-body text-muted-foreground">
          <li>Go to Meta Business Suite → Insights</li>
          <li>Select the date range you want to export</li>
          <li>Click "Export data" and select CSV format</li>
          <li>Download the file and upload it here</li>
        </ol>
      </div>

      {/* Upload Area */}
      <div
        className="bg-card rounded-lg border-2 border-dashed border-border p-12 text-center hover-elevate active-elevate-2 cursor-pointer"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById('file-input')?.click()}
        data-testid="dropzone-instagram"
      >
        <input
          id="file-input"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          data-testid="input-file"
        />
        
        <div className="flex flex-col items-center gap-4">
          {file ? (
            <>
              <Instagram className="w-12 h-12 text-primary" />
              <div>
                <p className="text-body font-medium text-foreground">{file.name}</p>
                <p className="text-small text-muted-foreground mt-1">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-muted-foreground" />
              <div>
                <p className="text-body font-medium text-foreground">Drop your CSV file here</p>
                <p className="text-small text-muted-foreground mt-1">or click to browse</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Import Button */}
      <button
        onClick={handleImport}
        disabled={!file || importing || !user}
        className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-3 font-medium hover-elevate active-elevate-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        data-testid="button-import"
      >
        {importing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Importing Posts...
          </>
        ) : (
          <>
            <Instagram className="w-5 h-5" />
            Import Instagram Posts
          </>
        )}
      </button>

      {/* Results */}
      {result && (
        <div className={`bg-card rounded-lg p-6 border ${result.success ? 'border-green-500' : 'border-red-500'}`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="text-h3 font-semibold text-foreground mb-2">
                {result.success ? 'Import Successful!' : 'Import Failed'}
              </h3>
              <div className="space-y-2 text-body text-foreground">
                <p>{result.postsImported} posts imported</p>
                {result.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-red-600 dark:text-red-400 mb-2">Errors:</p>
                    <ul className="list-disc list-inside space-y-1 text-small text-muted-foreground">
                      {result.errors.slice(0, 10).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                      {result.errors.length > 10 && (
                        <li>... and {result.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
