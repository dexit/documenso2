import { Trans } from '@lingui/react/macro';
import { trpc } from '~/lib/utils/trpc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@documenso/ui/primitives/table';
import { Card, CardContent, CardHeader, CardTitle } from '@documenso/ui/primitives/card';
import { format } from 'date-fns';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@documenso/ui/primitives/dialog';

export default function AdminApiLogsPage() {
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const { data, isLoading } = trpc.admin.logs.findApiLogs.useQuery({
    page: 1,
    perPage: 50,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans>API Logs</Trans>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((log) => (
                <TableRow key={log.id} className="cursor-pointer" onClick={() => setSelectedLog(log)}>
                  <TableCell className="font-bold">{log.method}</TableCell>
                  <TableCell>{log.path}</TableCell>
                  <TableCell>{log.responseStatus}</TableCell>
                  <TableCell>{log.duration}ms</TableCell>
                  <TableCell>{format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto text-foreground">
          <DialogHeader>
            <DialogTitle>API Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-foreground">Request info</h4>
                <p>{selectedLog.method} {selectedLog.path}</p>
                <p>IP: {selectedLog.ipAddress}</p>
              </div>
              <div>
                <h4 className="font-bold text-foreground">Request Body</h4>
                <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedLog.requestBody, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-bold text-foreground">Response Body</h4>
                <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedLog.responseBody, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
