import { Trans } from '@lingui/react/macro';
import { trpc } from '~/lib/utils/trpc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@documenso/ui/primitives/table';
import { Card, CardContent, CardHeader, CardTitle } from '@documenso/ui/primitives/card';
import { format } from 'date-fns';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@documenso/ui/primitives/dialog';

export default function AdminEmailLogsPage() {
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const { data, isLoading } = trpc.admin.logs.findEmailLogs.useQuery({
    page: 1,
    perPage: 50,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans>Email Logs</Trans>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Interactions</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((log) => (
                <TableRow key={log.id} className="cursor-pointer" onClick={() => setSelectedLog(log)}>
                  <TableCell>{log.recipient}</TableCell>
                  <TableCell>{log.subject}</TableCell>
                  <TableCell>{log.status}</TableCell>
                  <TableCell>{log.interactions.length} opens</TableCell>
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
            <DialogTitle>Email Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold">Metadata</h4>
                <p>Recipient: {selectedLog.recipient}</p>
                <p>Subject: {selectedLog.subject}</p>
                <p>From: {selectedLog.from}</p>
                <p>Status: {selectedLog.status}</p>
                {selectedLog.error && <p className="text-destructive">Error: {selectedLog.error}</p>}
              </div>
              <div>
                <h4 className="font-bold">Interactions</h4>
                <ul>
                  {selectedLog.interactions.map((i: any) => (
                    <li key={i.id} className="text-sm">
                      {format(new Date(i.createdAt), 'yyyy-MM-dd HH:mm:ss')} - {i.type}
                    </li>
                  ))}
                  {selectedLog.interactions.length === 0 && <li className="text-sm italic">No interactions yet</li>}
                </ul>
              </div>
              <div>
                <h4 className="font-bold">Body</h4>
                <div className="bg-muted p-2 rounded text-xs overflow-x-auto border text-foreground" dangerouslySetInnerHTML={{ __html: selectedLog.body }} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
