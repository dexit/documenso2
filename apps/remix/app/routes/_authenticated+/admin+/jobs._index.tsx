import { Trans } from '@lingui/react/macro';
import { trpc } from '~/lib/utils/trpc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@documenso/ui/primitives/table';
import { Card, CardContent, CardHeader, CardTitle } from '@documenso/ui/primitives/card';
import { Button } from '@documenso/ui/primitives/button';
import { format } from 'date-fns';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@documenso/ui/primitives/dialog';

export default function AdminJobsPage() {
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const { data, isLoading, refetch } = trpc.admin.jobs.find.useQuery({
    page: 1,
    perPage: 50,
  });

  const retryMutation = trpc.admin.jobs.retry.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedJob(null);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans>Background Jobs</Trans>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((job) => (
                <TableRow key={job.id} className="cursor-pointer" onClick={() => setSelectedJob(job)}>
                  <TableCell>{job.name}</TableCell>
                  <TableCell>{job.status}</TableCell>
                  <TableCell>{job.retried} / {job.maxRetries}</TableCell>
                  <TableCell>{format(new Date(job.submittedAt), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {job.status === 'FAILED' && (
                      <Button
                        size="sm"
                        onClick={() => retryMutation.mutate({ id: job.id })}
                        disabled={retryMutation.isPending}
                      >
                        Retry
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto text-foreground">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold">Info</h4>
                <p>Name: {selectedJob.name}</p>
                <p>Status: {selectedJob.status}</p>
                <p>Version: {selectedJob.version}</p>
                <p>Submitted: {format(new Date(selectedJob.submittedAt), 'yyyy-MM-dd HH:mm:ss')}</p>
                {selectedJob.completedAt && <p>Completed: {format(new Date(selectedJob.completedAt), 'yyyy-MM-dd HH:mm:ss')}</p>}
              </div>
              <div>
                <h4 className="font-bold">Payload</h4>
                <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedJob.payload, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-bold">Tasks</h4>
                <ul className="space-y-2 text-foreground">
                  {selectedJob.tasks.map((task: any) => (
                    <li key={task.id} className="text-sm p-2 bg-muted rounded">
                      <div className="flex justify-between">
                        <span className="font-medium">{task.name}</span>
                        <span>{task.status}</span>
                      </div>
                      {task.result && (
                        <pre className="mt-1 text-[10px] overflow-x-auto">
                          {JSON.stringify(task.result, null, 2)}
                        </pre>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              {selectedJob.status === 'FAILED' && (
                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={() => retryMutation.mutate({ id: selectedJob.id })}
                    disabled={retryMutation.isPending}
                  >
                    Retry Job
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
