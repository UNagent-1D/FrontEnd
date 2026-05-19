'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Trash2, Users } from 'lucide-react'

import { deleteUser, listUsers, updateUser } from '@/api/apiService'
import { useAuthStore } from '@/store/authStore'
import { roleBadgeVariant, roleLabel } from '@/lib/palette'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/layout/EmptyState'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import type { UserResponse } from '@/types'

export const UsersManager = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({ title: 'User deleted' })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? 'Could not delete user'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateUser(id, { is_active }),
    onSuccess: (updated) => {
      setTogglingId(null)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({ title: updated.is_active ? 'User activated' : 'User deactivated' })
    },
    onError: (err: any) => {
      setTogglingId(null)
      const msg = err?.response?.data?.error ?? 'Could not update user'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const isSelf = (u: UserResponse) => u.id === currentUser?.id

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description={
          currentUser?.role === 'app_admin'
            ? 'All platform users across every tenant.'
            : 'Users in your organization.'
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>User list</CardTitle>
          <CardDescription>
            {isLoading
              ? 'Loading users…'
              : `${users.length} user${users.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isError ? (
            <p className="p-6 text-sm text-destructive">Error loading users.</p>
          ) : isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="No users yet"
                description="Create users from the organization management page."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {currentUser?.role === 'app_admin' && <TableHead>Tenant</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-sm">
                      {u.email}
                      {isSelf(u) && (
                        <Badge variant="outline" className="ml-2 text-xs">you</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant[u.role]}>{roleLabel[u.role]}</Badge>
                    </TableCell>
                    {currentUser?.role === 'app_admin' && (
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {u.tenant_id ? u.tenant_id.slice(0, 8) : '—'}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant={u.is_active ? 'success' : 'secondary'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isSelf(u) || togglingId === u.id}
                              onClick={() => {
                                setTogglingId(u.id)
                                toggleMutation.mutate({ id: u.id, is_active: !u.is_active })
                              }}
                            >
                              {togglingId === u.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                u.is_active ? 'Deactivate' : 'Activate'
                              )}
                            </Button>
                          </TooltipTrigger>
                          {isSelf(u) && (
                            <TooltipContent>Cannot modify yourself</TooltipContent>
                          )}
                        </Tooltip>

                        <AlertDialog>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  disabled={isSelf(u) || deleteMutation.isPending}
                                  onClick={() => setDeletingId(u.id)}
                                >
                                  {deleteMutation.isPending && deletingId === u.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="size-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                            </TooltipTrigger>
                            {isSelf(u) && (
                              <TooltipContent>Cannot delete yourself</TooltipContent>
                            )}
                          </Tooltip>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete user?</AlertDialogTitle>
                              <AlertDialogDescription>
                                <span className="font-mono font-medium">{u.email}</span> will be
                                permanently deleted. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeletingId(null)}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteMutation.mutate(u.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
