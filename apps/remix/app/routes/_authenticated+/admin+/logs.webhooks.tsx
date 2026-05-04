import { Trans } from '@lingui/react/macro';
import { trpc } from '~/lib/utils/trpc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@documenso/ui/primitives/table';
import { Card, CardContent, CardHeader, CardTitle } from '@documenso/ui/primitives/card';
import { Button } from '@documenso/ui/primitives/button';
import { format } from 'date-fns';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@documenso/ui/primitives/dialog';

export default function AdminWebhookLogsPage() {
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const { data, isLoading, refetch } = trpc.admin.logs.findWebhookLogs.useQuery({
    page: 1,
    perPage: 50,
  });

  const replayMutation = trpc.admin.logs.replayWebhook.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedLog(null);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans>Webhook Logs</Trans>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((log) => (
                <TableRow key={log.id} className="cursor-pointer" onClick={() => setSelectedLog(log)}>
                  <TableCell className="max-w-xs truncate">{log.url}</TableCell>
                  <TableCell>{log.event}</TableCell>
                  <TableCell>{log.status}</TableCell>
                  <TableCell>{format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      onClick={() => replayMutation.mutate({ id: log.id })}
                      disabled={replayMutation.isPending}
                    >
                      Replay
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto text-foreground">
          <DialogHeader>
            <DialogTitle>Webhook Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold">Info</h4>
                <p>URL: {selectedLog.url}</p>
                <p>Event: {selectedLog.event}</p>
                <p>Status: {selectedLog.status}</p>
                <p>Response Code: {selectedLog.responseCode}</p>
              </div>
              <div>
                <h4 className="font-bold">Request Body</h4>
                <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedLog.requestBody, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-bold">Response Body</h4>
                <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedLog.responseBody, null, 2)}
                </pre>
              </div>
              <div className="pt-4 flex justify-end">
                <Button
                  onClick={() => replayMutation.mutate({ id: selectedLog.id })}
                  disabled={replayMutation.isPending}
                >
                  Replay this Webhook
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
