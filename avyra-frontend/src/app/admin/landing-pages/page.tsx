"use client";

import Link from "next/link";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Badge, Card, EmptyState, Spinner } from "@/components/ui/misc";
import { toApiError } from "@/lib/api";
import { useAdminLandingPages, useDeleteLandingPage, useMe } from "@/lib/admin";
import { formatDate } from "@/lib/format";

export default function AdminLandingPagesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminLandingPages({ search: search || undefined });
  const remove = useDeleteLandingPage();
  const { data: me } = useMe();

  const pages = data?.data ?? [];
  const canCreate = me?.permissions.marketing?.create ?? false;
  const canDelete = me?.permissions.marketing?.delete ?? false;

  const confirmDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;

    try {
      await remove.mutateAsync(id);
      toast.success("Landing page deleted");
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Landing Pages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build a campaign page and publish it at /lp/&lt;slug&gt;
          </p>
        </div>

        {canCreate && (
          <ButtonLink href="/admin/landing-pages/new">
            <Plus className="h-4 w-4" /> New page
          </ButtonLink>
        )}
      </div>

      <Card className="p-4">
        <Input
          type="search"
          placeholder="Search by title or slug"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search landing pages"
        />
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner className="text-primary" />
        </div>
      ) : pages.length === 0 ? (
        <EmptyState
          title="No landing pages yet"
          description="Create one to run a campaign with its own order form."
          action={canCreate ? <ButtonLink href="/admin/landing-pages/new">New page</ButtonLink> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => {
            const conversion = page.views > 0 ? ((page.orders / page.views) * 100).toFixed(1) : "0.0";

            return (
              <Card key={page.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-foreground">{page.title}</h2>
                    <p className="truncate text-xs text-muted-foreground">/lp/{page.slug}</p>
                  </div>
                  <Badge tone={page.is_active ? "success" : "neutral"}>
                    {page.is_active ? "Live" : "Draft"}
                  </Badge>
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <dt className="text-xs text-muted-foreground">Views</dt>
                    <dd className="text-lg font-semibold tabular-nums text-foreground">{page.views}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Orders</dt>
                    <dd className="text-lg font-semibold tabular-nums text-foreground">{page.orders}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Conv.</dt>
                    <dd className="text-lg font-semibold tabular-nums text-primary">{conversion}%</dd>
                  </div>
                </dl>

                <p className="mt-3 text-xs text-muted-foreground">
                  Updated {formatDate(page.updated_at ?? null)}
                </p>

                <div className="mt-4 flex flex-1 items-end gap-2">
                  <Link href={`/admin/landing-pages/${page.id}`} className="flex-1">
                    <Button block size="sm" variant="outline">Edit</Button>
                  </Link>

                  <a href={`/lp/${page.slug}`} target="_blank" rel="noreferrer noopener">
                    <Button size="sm" variant="ghost" aria-label="Preview page">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>

                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => confirmDelete(page.id, page.title)}
                      aria-label={`Delete ${page.title}`}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
