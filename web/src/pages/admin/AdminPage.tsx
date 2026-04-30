import {useState} from "react";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {Card, CardContent, CardHeader, CardTitle} from "../../components/ui/card";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Spinner} from "../../components/ui/spinner";
import {formatDate} from "../../lib/utils";
import {Users, Database, HardDrive} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  premium_level: string;
  premium_expiry: number | null;
  created_at: string;
}

interface AdminStats {
  users: {total: number};
  sessions: {total: number; totalStorage: number; totalRows: number};
  premium: {total: number};
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    display_name: "",
    role: "",
    premium_level: "",
    premium_expiry: "",
    password: "",
  });

  const {data: stats} = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats", {
        headers: {Authorization: `Bearer ${localStorage.getItem("token")}`},
      });
      if (!res.ok) throw new Error("Forbidden");
      return res.json();
    },
  });

  const {data: usersData, isLoading} = useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () => {
      const params = new URLSearchParams({limit: "100"});
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: {Authorization: `Bearer ${localStorage.getItem("token")}`},
      });
      if (!res.ok) throw new Error("Forbidden");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({id, data}: {id: string; data: Record<string, unknown>}) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}`},
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["admin-users"]});
      setEditingUser(null);
    },
  });

  const users: AdminUser[] = usersData?.users || [];

  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({
      display_name: user.display_name,
      role: user.role,
      premium_level: user.premium_level,
      premium_expiry: user.premium_expiry ? new Date(user.premium_expiry * 1000).toISOString().slice(0, 10) : "",
      password: "",
    });
  };

  const saveEdit = () => {
    if (!editingUser) return;
    const updates: Record<string, unknown> = {};
    if (editForm.display_name !== editingUser.display_name) updates.display_name = editForm.display_name;
    if (editForm.role !== editingUser.role) updates.role = editForm.role;
    if (editForm.premium_level !== editingUser.premium_level) updates.premium_level = editForm.premium_level;
    if (editForm.premium_expiry) updates.premium_expiry = Math.floor(new Date(editForm.premium_expiry).getTime() / 1000);
    if (editForm.password) updates.password = editForm.password;
    if (Object.keys(updates).length > 0) {
      updateMutation.mutate({id: editingUser.id, data: updates});
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm text-muted-foreground">Users</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.users?.total || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm text-muted-foreground">Sessions</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.sessions?.total || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm text-muted-foreground">Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{((stats?.sessions?.totalStorage || 0) / 1024 / 1024).toFixed(1)} MB</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Premium</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.premium?.total || 0}</p></CardContent>
        </Card>
      </div>

      {/* Users */}
      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-center p-2">Role</th>
                    <th className="text-center p-2">Premium</th>
                    <th className="text-right p-2">Created</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-accent/50">
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">{u.display_name || "--"}</td>
                      <td className="p-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-2 text-center capitalize">{u.premium_level}</td>
                      <td className="p-2 text-right text-muted-foreground">{formatDate(u.created_at)}</td>
                      <td className="p-2 text-center">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingUser(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Edit User: {editingUser.email}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input value={editForm.display_name} onChange={(e) => setEditForm({...editForm, display_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Premium Level</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={editForm.premium_level}
                  onChange={(e) => setEditForm({...editForm, premium_level: e.target.value})}
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Premium Expiry</label>
                <Input type="date" value={editForm.premium_expiry} onChange={(e) => setEditForm({...editForm, premium_expiry: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password (leave blank to keep)</label>
                <Input type="password" value={editForm.password} onChange={(e) => setEditForm({...editForm, password: e.target.value})} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                <Button onClick={saveEdit} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Spinner /> : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
