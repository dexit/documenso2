import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { trpc as trpcReact } from '@documenso/trpc/react';
import { Alert, AlertDescription } from '@documenso/ui/primitives/alert';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@documenso/ui/primitives/dialog';
import { useToast } from '@documenso/ui/primitives/use-toast';

type DocumentResealDialogProps = {
  documentId: number;
  documentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const DocumentResealDialog = ({
  documentId,
  documentTitle,
  open,
  onOpenChange,
}: DocumentResealDialogProps) => {
  const { toast } = useToast();
  const { _ } = useLingui();

  const { mutateAsync: resealDocument, isPending } = trpcReact.document.reseal.useMutation({
    onSuccess: () => {
      toast({
        title: _(msg`Sealing job started`),
        description: _(msg`The document sealing process has been restarted.`),
        duration: 5000,
      });

      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: _(msg`Something went wrong`),
        description: _(msg`The document could not be resealed at this time. Please try again.`),
        variant: 'destructive',
        duration: 7500,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(value) => !isPending && onOpenChange(value)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans>Reseal Document</Trans>
          </DialogTitle>

          <DialogDescription>
            <Trans>
              You are about to reseal <strong>"{documentTitle}"</strong>.
            </Trans>
          </DialogDescription>
        </DialogHeader>

        <Alert variant="warning" className="-mt-1">
          <AlertDescription>
            <Trans>
              This will restart the background sealing process for this document. This is useful if the document was not correctly sealed or if there were technical issues during the initial sealing.
            </Trans>
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            <Trans>Cancel</Trans>
          </Button>

          <Button
            type="button"
            loading={isPending}
            onClick={() => void resealDocument({ documentId })}
          >
            <Trans>Reseal</Trans>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
