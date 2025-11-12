import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogOut, Search, Trash2, Users, BookOpen, Calendar } from "lucide-react";
import { toast } from "sonner";
import { thematicAxes } from "@/data/thematicAxes";

interface Registration {
  id: string;
  student_name: string;
  student_email: string;
  axis_id: string;
  axis_title: string;
  team_members: any; // JSONB from database
  registered_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut, loading } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAxis, setSelectedAxis] = useState<string>("all");
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !isAdmin) {
      toast.error("Acesso negado", {
        description: "Você não tem permissão para acessar o painel administrativo.",
      });
      navigate("/");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchRegistrations();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    filterRegistrations();
  }, [registrations, searchTerm, selectedAxis]);

  const fetchRegistrations = async () => {
    setIsLoadingData(true);
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .order("registered_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar inscrições", {
        description: error.message,
      });
    } else {
      setRegistrations(data || []);
    }
    setIsLoadingData(false);
  };

  const filterRegistrations = () => {
    let filtered = registrations;

    if (searchTerm) {
      filtered = filtered.filter(
        (reg) =>
          reg.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reg.student_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedAxis !== "all") {
      filtered = filtered.filter((reg) => reg.axis_id === selectedAxis);
    }

    setFilteredRegistrations(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta inscrição?")) {
      return;
    }

    const { error } = await supabase.from("registrations").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir inscrição", {
        description: error.message,
      });
    } else {
      toast.success("Inscrição excluída com sucesso!");
      fetchRegistrations();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const stats = {
    total: registrations.length,
    byAxis: thematicAxes.map((axis) => ({
      id: axis.id,
      title: axis.title,
      count: registrations.filter((r) => r.axis_id === axis.id).length,
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-hero text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
              <p className="text-white/80">Saberes em Conexão 2025</p>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Inscrições</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Eixos Temáticos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{thematicAxes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Data do Evento</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">8-12 Dez 2025</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Busque e filtre as inscrições</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedAxis} onValueChange={setSelectedAxis}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por eixo temático" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os eixos</SelectItem>
                  {thematicAxes.map((axis) => (
                    <SelectItem key={axis.id} value={axis.id}>
                      {axis.title} ({stats.byAxis.find((s) => s.id === axis.id)?.count || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Registrations Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Inscrições ({filteredRegistrations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Eixo Temático</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhuma inscrição encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRegistrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell className="font-medium">{reg.student_name}</TableCell>
                        <TableCell>{reg.student_email}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={reg.axis_title}>
                            {reg.axis_title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {Array.isArray(reg.team_members) ? reg.team_members.length : 0} integrantes
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(reg.registered_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(reg.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
