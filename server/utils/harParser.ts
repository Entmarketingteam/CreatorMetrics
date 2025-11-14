/**
 * HAR (HTTP Archive) File Parser
 * 
 * Extracts unique LTK API endpoints from HAR files captured from browser DevTools.
 * 
 * Usage:
 * 1. In browser DevTools Network tab → Right-click → "Save all as HAR with content"
 * 2. Upload HAR file to this project
 * 3. Run: node --loader tsx server/utils/harParser.ts path/to/file.har
 */

interface HAREntry {
  request: {
    method: string;
    url: string;
    headers: Array<{ name: string; value: string }>;
    queryString: Array<{ name: string; value: string }>;
  };
  response: {
    status: number;
    statusText: string;
  };
}

interface HARFile {
  log: {
    entries: HAREntry[];
  };
}

interface ParsedEndpoint {
  method: string;
  path: string;
  fullUrl: string;
  queryParams: string[];
  status: number;
  count: number;
}

export function parseHARFile(harContent: string): ParsedEndpoint[] {
  let har: HARFile;
  
  try {
    har = JSON.parse(harContent);
  } catch (error) {
    throw new Error('Invalid HAR file: Not valid JSON');
  }

  // Defensive guards for malformed HAR structure
  if (!har || !har.log || !Array.isArray(har.log.entries)) {
    throw new Error('Invalid HAR file: Missing log.entries structure');
  }

  const endpoints = new Map<string, ParsedEndpoint>();

  // Filter for LTK API requests
  const ltkEntries = har.log.entries.filter(entry => 
    entry?.request?.url && entry.request.url.includes('api-gateway.rewardstyle.com')
  );

  console.log(`\nFound ${ltkEntries.length} LTK API requests in HAR file\n`);

  for (const entry of ltkEntries) {
    const url = new URL(entry.request.url);
    const path = url.pathname;
    const method = entry.request.method;
    const key = `${method} ${path}`;

    // Extract query parameter names (not values)
    const queryParams = Array.from(url.searchParams.keys());

    if (endpoints.has(key)) {
      const existing = endpoints.get(key)!;
      existing.count++;
      // Merge unique query params
      for (const param of queryParams) {
        if (!existing.queryParams.includes(param)) {
          existing.queryParams.push(param);
        }
      }
    } else {
      endpoints.set(key, {
        method,
        path,
        fullUrl: entry.request.url.split('?')[0],
        queryParams,
        status: entry.response.status,
        count: 1
      });
    }
  }

  return Array.from(endpoints.values())
    .sort((a, b) => {
      // Sort by path, then method
      if (a.path < b.path) return -1;
      if (a.path > b.path) return 1;
      return a.method.localeCompare(b.method);
    });
}

export function generateEndpointReport(endpoints: ParsedEndpoint[]): string {
  let report = '# LTK API Endpoints Discovered\n\n';
  report += `Total unique endpoints: ${endpoints.length}\n\n`;

  // Group by API category
  const categories = new Map<string, ParsedEndpoint[]>();
  
  for (const endpoint of endpoints) {
    const category = endpoint.path.split('/')[2] || 'other'; // Extract category from path
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push(endpoint);
  }

  // Generate report by category
  for (const [category, categoryEndpoints] of categories) {
    report += `## ${category.toUpperCase()}\n\n`;
    
    for (const endpoint of categoryEndpoints) {
      report += `### ${endpoint.method} ${endpoint.path}\n`;
      report += `- Full URL: ${endpoint.fullUrl}\n`;
      report += `- Called: ${endpoint.count} times\n`;
      report += `- Status: ${endpoint.status}\n`;
      
      if (endpoint.queryParams.length > 0) {
        report += `- Query Params: ${endpoint.queryParams.join(', ')}\n`;
      }
      
      report += '\n';
    }
  }

  return report;
}

// CLI usage - simplified check that works with both absolute and relative paths
if (process.argv.length > 2 && process.argv[2]?.endsWith('.har')) {
  const fs = await import('fs');
  const path = await import('path');
  
  const harPath = process.argv[2];
  
  if (!harPath) {
    console.error('Usage: tsx server/utils/harParser.ts <har-file-path>');
    process.exit(1);
  }

  if (!fs.existsSync(harPath)) {
    console.error(`File not found: ${harPath}`);
    process.exit(1);
  }

  try {
    const harContent = fs.readFileSync(harPath, 'utf-8');
    const endpoints = parseHARFile(harContent);
    const report = generateEndpointReport(endpoints);

    // Save report
    const reportPath = path.join(path.dirname(harPath), 'ltk-endpoints-report.md');
    fs.writeFileSync(reportPath, report);

    console.log(report);
    console.log(`\n✅ Report saved to: ${reportPath}`);
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}
