import { useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import {
  AlertTriangleIcon,
  BanIcon,
  BotIcon,
  GlobeIcon,
  RouteIcon,
  ServerCrashIcon,
  ShieldAlertIcon,
  ShieldOffIcon,
  TrashIcon,
} from 'lucide-react';
import { useSearchParams } from 'react-router';

import { useDebouncedValue } from '@documenso/lib/client-only/hooks/use-debounced-value';
import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { trpc } from '@documenso/trpc/react';
import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import type { DataTableColumnDef } from '@documenso/ui/primitives/data-table';
import { DataTable } from '@documenso/ui/primitives/data-table';
import { DataTablePagination } from '@documenso/ui/primitives/data-table-pagination';
import { Input } from '@documenso/ui/primitives/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import { Skeleton } from '@documenso/ui/primitives/skeleton';
import { TableCell } from '@documenso/ui/primitives/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@documenso/ui/primitives/tooltip';

import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags(msg`HTTP Monitor`);
}

type StatCardProps = {
  icon: React.ReactNode;
  label: React.ReactNode;
  value: React.ReactNode;
  colorClass?: string;
};

function StatCard({
  icon,
  label,
  value,
  colorClass = 'bg-blue-100 dark:bg-blue-900/30',
}: StatCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
      <div className={`rounded-full p-2 ${colorClass}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-bold leading-none">{value}</p>
      </div>
    </div>
  );
}

export default function AdminHttpMonitorPage() {
  const { _ } = useLingui();
  const [searchParams] = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const page = Number(searchParams.get('page') ?? 1);
  const perPage = Number(searchParams.get('perPage') ?? 50);
  const pathFilter = searchParams.get('path') ?? '';
  const ipFilter = searchParams.get('ip') ?? '';

  const debouncedPath = useDebouncedValue(pathFilter, 400);
  const debouncedIP = useDebouncedValue(ipFilter, 400);

  const [blockPattern, setBlockPattern] = useState('');
  const [blockType, setBlockType] = useState<'exact' | 'prefix' | 'contains'>('exact');
  const [blockReason, setBlockReason] = useState('');

  const { data, isLoading } = trpc.admin.httpMonitor.get.useQuery(
    {
      page,
      perPage,
      pathFilter: debouncedPath || undefined,
      ipFilter: debouncedIP || undefined,
    },
    { refetchInterval: 15_000, placeholderData: (prev) => prev },
  );

  const { data: blockList = [], refetch: refetchBlockList } =
    trpc.admin.httpMonitor.blockList.useQuery(undefined, { refetchInterval: 30_000 });

  const addBlock = trpc.admin.httpMonitor.addBlock.useMutation({
    onSuccess: () => {
      void refetchBlockList();
      setBlockPattern('');
      setBlockReason('');
    },
  });

  const removeBlock = trpc.admin.httpMonitor.removeBlock.useMutation({
    onSuccess: () => void refetchBlockList(),
  });

  const stats = data?.stats;

  const columns = useMemo(() => {
    return [
      {
        header: _(msg`Time`),
        accessorKey: 'timestamp',
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
            {new Date(row.original.timestamp).toLocaleTimeString()}
          </span>
        ),
      },
      {
        header: _(msg`Method`),
        accessorKey: 'method',
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-mono text-xs">
            {row.original.method}
          </Badge>
        ),
      },
      {
        header: _(msg`Path`),
        accessorKey: 'path',
        cell: ({ row }) => (
          <span className="max-w-xs truncate font-mono text-xs" title={row.original.path}>
            {row.original.path}
          </span>
        ),
      },
      {
        header: _(msg`IP`),
        accessorKey: 'ip',
        cell: ({ row }) => (
          <button
            className="font-mono text-xs text-primary hover:underline"
            onClick={() => updateSearchParams({ ip: row.original.ip, page: 1 })}
          >
            {row.original.ip}
          </button>
        ),
      },
      {
        header: _(msg`Status`),
        accessorKey: 'statusCode',
        cell: ({ row }) => {
          const code = row.original.statusCode;
          const variant = code >= 500 ? 'destructive' : code === 403 ? 'warning' : 'destructive';
          return <Badge variant={variant}>{code}</Badge>;
        },
      },
      {
        header: _(msg`User Agent`),
        accessorKey: 'userAgent',
        cell: ({ row }) => {
          const isBot =
            /bot|crawler|spider|curl|wget|python|zgrab|masscan|nuclei|sqlmap|dirbuster|gobuster|ffuf/i.test(
              row.original.userAgent,
            );
          return (
            <div className="flex max-w-[200px] items-center gap-1">
              {isBot && <BotIcon className="h-3 w-3 shrink-0 text-destructive" />}
              <span
                className="truncate text-xs text-muted-foreground"
                title={row.original.userAgent}
              >
                {row.original.userAgent || '—'}
              </span>
            </div>
          );
        },
      },
      {
        header: _(msg`Referer`),
        accessorKey: 'referer',
        cell: ({ row }) => (
          <span
            className="max-w-[150px] truncate text-xs text-muted-foreground"
            title={row.original.referer ?? ''}
          >
            {row.original.referer ?? '—'}
          </span>
        ),
      },
      {
        header: _(msg`Block`),
        accessorKey: 'id',
        cell: ({ row }) => {
          const path = row.original.path.split('?')[0];
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-destructive hover:bg-destructive/10"
                  onClick={() =>
                    addBlock.mutate({
                      pattern: path,
                      type: 'exact',
                      reason: `Blocked from HTTP monitor — status ${row.original.statusCode}`,
                    })
                  }
                >
                  <BanIcon className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <Trans>Block this path</Trans>
              </TooltipContent>
            </Tooltip>
          );
        },
      },
    ] satisfies DataTableColumnDef<NonNullable<typeof data>['entries'][number]>[];
  }, [_, updateSearchParams, addBlock]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-4xl font-semibold">
          <Trans>HTTP Monitor</Trans>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <Trans>
            Live tracking of 4xx/5xx errors, bot probes, and requests to non-existent routes. Resets
            on server restart. Up to 2,000 entries stored in memory.
          </Trans>
        </p>
      </div>

      {/* Overview stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<AlertTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />}
          label={<Trans>Total 4xx errors</Trans>}
          value={isLoading ? '—' : (stats?.total4xx ?? 0).toLocaleString()}
          colorClass="bg-red-100 dark:bg-red-900/30"
        />
        <StatCard
          icon={<ServerCrashIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
          label={<Trans>Total 5xx errors</Trans>}
          value={isLoading ? '—' : (stats?.total5xx ?? 0).toLocaleString()}
          colorClass="bg-rose-100 dark:bg-rose-900/30"
        />
        <StatCard
          icon={<GlobeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          label={<Trans>Unique IPs</Trans>}
          value={isLoading ? '—' : (stats?.uniqueIPs ?? 0).toLocaleString()}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          icon={<RouteIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
          label={<Trans>Unique Paths</Trans>}
          value={isLoading ? '—' : (stats?.uniquePaths ?? 0).toLocaleString()}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
        />
      </div>

      {/* Top insights panels */}
      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Top paths */}
          <div className="rounded-lg border p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium">
              <RouteIcon className="h-4 w-4" />
              <Trans>Top hit paths</Trans>
            </p>
            <div className="space-y-1.5">
              {stats.topPaths.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  <Trans>No data yet</Trans>
                </p>
              ) : (
                stats.topPaths.map(({ path, count }) => (
                  <div key={path} className="flex items-center justify-between gap-2">
                    <button
                      className="max-w-[160px] truncate text-left font-mono text-xs text-primary hover:underline"
                      title={path}
                      onClick={() => updateSearchParams({ path, page: 1 })}
                    >
                      {path}
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1 text-destructive hover:bg-destructive/10"
                            onClick={() =>
                              addBlock.mutate({
                                pattern: path,
                                type: 'exact',
                                reason: 'Blocked from top paths panel',
                              })
                            }
                          >
                            <BanIcon className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <Trans>Block</Trans>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top IPs */}
          <div className="rounded-lg border p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium">
              <GlobeIcon className="h-4 w-4" />
              <Trans>Top IPs</Trans>
            </p>
            <div className="space-y-1.5">
              {stats.topIPs.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  <Trans>No data yet</Trans>
                </p>
              ) : (
                stats.topIPs.map(({ ip, count, isSuspicious }) => (
                  <div key={ip} className="flex items-center justify-between gap-2">
                    <button
                      className="flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                      onClick={() => updateSearchParams({ ip, page: 1 })}
                    >
                      {isSuspicious && (
                        <ShieldAlertIcon className="h-3 w-3 shrink-0 text-destructive" />
                      )}
                      {ip}
                    </button>
                    <Badge
                      variant={isSuspicious ? 'destructive' : 'secondary'}
                      className="shrink-0 text-xs"
                    >
                      {count}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top user agents */}
          <div className="rounded-lg border p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium">
              <BotIcon className="h-4 w-4" />
              <Trans>Top user agents</Trans>
            </p>
            <div className="space-y-1.5">
              {stats.topUserAgents.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  <Trans>No data yet</Trans>
                </p>
              ) : (
                stats.topUserAgents.map(({ userAgent, count, isBot }) => (
                  <div key={userAgent} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1">
                      {isBot && <BotIcon className="h-3 w-3 shrink-0 text-destructive" />}
                      <span
                        className="max-w-[170px] truncate text-xs text-muted-foreground"
                        title={userAgent}
                      >
                        {userAgent || '(empty)'}
                      </span>
                    </div>
                    <Badge
                      variant={isBot ? 'destructive' : 'secondary'}
                      className="shrink-0 text-xs"
                    >
                      {count}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Block list management */}
      <div className="mb-6 rounded-lg border p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <ShieldOffIcon className="h-4 w-4 text-destructive" />
          <Trans>Block list</Trans>
          {blockList.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {blockList.length}
            </Badge>
          )}
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          <Trans>
            Paths matching a blocked pattern will receive a 403 response and be logged. Add patterns
            by clicking "Block" on a log row, or manually below.
          </Trans>
        </p>

        {/* Add new block form */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Input
            placeholder={_(msg`Pattern (e.g. /wp-login.php)`)}
            value={blockPattern}
            onChange={(e) => setBlockPattern(e.target.value)}
            className="max-w-xs"
          />
          <Select value={blockType} onValueChange={(v) => setBlockType(v as typeof blockType)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exact">
                <Trans>Exact</Trans>
              </SelectItem>
              <SelectItem value="prefix">
                <Trans>Prefix</Trans>
              </SelectItem>
              <SelectItem value="contains">
                <Trans>Contains</Trans>
              </SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder={_(msg`Reason (optional)`)}
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            className="max-w-xs"
          />
          <Button
            variant="destructive"
            size="sm"
            disabled={!blockPattern || addBlock.isPending}
            onClick={() =>
              addBlock.mutate({
                pattern: blockPattern,
                type: blockType,
                reason: blockReason || undefined,
              })
            }
          >
            <BanIcon className="mr-1.5 h-3.5 w-3.5" />
            <Trans>Add block</Trans>
          </Button>
        </div>

        {/* Current block list */}
        {blockList.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">
            <Trans>No patterns blocked yet.</Trans>
          </p>
        ) : (
          <div className="divide-y rounded-md border">
            {blockList.map((entry) => (
              <div
                key={`${entry.type}:${entry.pattern}`}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                      {entry.type}
                    </Badge>
                    <span className="truncate font-mono text-xs font-medium">{entry.pattern}</span>
                  </div>
                  {entry.reason && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{entry.reason}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(entry.addedAt).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-destructive hover:bg-destructive/10"
                    onClick={() => removeBlock.mutate({ pattern: entry.pattern })}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          type="search"
          placeholder={_(msg`Filter by path...`)}
          value={pathFilter}
          onChange={(e) => updateSearchParams({ path: e.target.value || undefined, page: 1 })}
          className="max-w-xs"
        />
        <Input
          type="search"
          placeholder={_(msg`Filter by IP...`)}
          value={ipFilter}
          onChange={(e) => updateSearchParams({ ip: e.target.value || undefined, page: 1 })}
          className="max-w-xs"
        />
      </div>

      {/* Log table */}
      <DataTable
        columns={columns}
        data={data?.entries ?? []}
        perPage={perPage}
        currentPage={page}
        totalPages={data?.totalPages ?? 1}
        onPaginationChange={(p, pp) => updateSearchParams({ page: p, perPage: pp })}
        skeleton={{
          enable: isLoading,
          rows: 8,
          component: (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <TableCell key={i}>
                  <Skeleton className="h-4 w-24 rounded" />
                </TableCell>
              ))}
            </>
          ),
        }}
      >
        {(table) => <DataTablePagination additionalInformation="VisibleCount" table={table} />}
      </DataTable>
    </div>
  );
}
