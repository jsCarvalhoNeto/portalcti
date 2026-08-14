import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Database, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  RotateCcw, 
  FileSpreadsheet, 
  Braces, 
  Table as TableIcon
} from 'lucide-react';

const FIRST_NAMES = [
  'Lucas', 'Gabriel', 'Mateus', 'Rafael', 'Guilherme', 'Enzo', 'Leonardo', 'Arthur', 'Felipe', 'Gustavo',
  'Mariana', 'Beatriz', 'Larissa', 'Camila', 'Fernanda', 'Juliana', 'Amanda', 'Letícia', 'Bruna', 'Sofia'
];

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
  'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa'
];

const CITIES = [
  { city: 'Boa Vista', state: 'RR' },
  { city: 'Manaus', state: 'AM' },
  { city: 'São Paulo', state: 'SP' },
  { city: 'Rio de Janeiro', state: 'RJ' },
  { city: 'Belo Horizonte', state: 'MG' },
  { city: 'Curitiba', state: 'PR' },
  { city: 'Fortaleza', state: 'CE' },
  { city: 'Brasília', state: 'DF' },
  { city: 'Recife', state: 'PE' },
  { city: 'Salvador', state: 'BA' }
];

const ROLES = [
  'Desenvolvedor Frontend', 'Desenvolvedor Backend', 'Analista de Sistemas',
  'DBA / Administrador de Banco', 'Técnico de Suporte', 'Engenheiro de DevOps',
  'UI/UX Designer', 'Analista de QA / Testes', 'Especialista em Redes'
];

const COURSES = [
  'Técnico em Informática', 'Desenvolvimento Web', 'Banco de Dados & SQL',
  'Redes de Computadores', 'Manutenção & Suporte', 'Inteligência Artificial'
];

interface MockPerson {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  cidade: string;
  estado: string;
  cargo: string;
  salario: number;
  curso: string;
  ativo: boolean;
}

export default function MockDataGeneratorUtility() {
  const [recordCount, setRecordCount] = useState<number>(10);
  const [outputFormat, setOutputFormat] = useState<'json' | 'sql' | 'csv' | 'table'>('json');
  const [tableName, setTableName] = useState('alunos');
  const [copied, setCopied] = useState(false);

  const generateCPF = () => {
    const r = () => Math.floor(Math.random() * 9);
    return `${r()}${r()}${r()}.${r()}${r()}${r()}.${r()}${r()}${r()}-${r()}${r()}`;
  };

  const generatePhone = () => {
    const ddd = ['95', '92', '11', '21', '31', '41', '85'][Math.floor(Math.random() * 7)];
    const n1 = Math.floor(1000 + Math.random() * 9000);
    const n2 = Math.floor(1000 + Math.random() * 9000);
    return `(${ddd}) 9${n1}-${n2}`;
  };

  const [data, setData] = useState<MockPerson[]>(() => generateMockData(10));

  function generateMockData(count: number): MockPerson[] {
    const list: MockPerson[] = [];
    for (let i = 1; i <= count; i++) {
      const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const fullName = `${first} ${last}`;
      const cleanEmail = `${first.toLowerCase()}.${last.toLowerCase()}${i > 5 ? i : ''}@cursotecnico.edu.br`;
      const location = CITIES[Math.floor(Math.random() * CITIES.length)];
      const role = ROLES[Math.floor(Math.random() * ROLES.length)];
      const course = COURSES[Math.floor(Math.random() * COURSES.length)];
      const salary = parseFloat((2500 + Math.random() * 4500).toFixed(2));

      list.push({
        id: i,
        nome: fullName,
        email: cleanEmail,
        cpf: generateCPF(),
        telefone: generatePhone(),
        cidade: location.city,
        estado: location.state,
        cargo: role,
        salario: salary,
        curso: course,
        ativo: Math.random() > 0.15
      });
    }
    return list;
  }

  const handleRegenerate = (count: number) => {
    setRecordCount(count);
    setData(generateMockData(count));
  };

  const getFormattedOutput = (): string => {
    if (outputFormat === 'json') {
      return JSON.stringify(data, null, 2);
    }
    if (outputFormat === 'sql') {
      const inserts = data.map(d => {
        return `INSERT INTO ${tableName} (id, nome, email, cpf, telefone, cidade, estado, cargo, salario, curso, ativo)\nVALUES (${d.id}, '${d.nome}', '${d.email}', '${d.cpf}', '${d.telefone}', '${d.cidade}', '${d.estado}', '${d.cargo}', ${d.salario}, '${d.curso}', ${d.ativo ? 'TRUE' : 'FALSE'});`;
      });
      return `-- Tabela: ${tableName} (${data.length} registros)\n` + inserts.join('\n\n');
    }
    if (outputFormat === 'csv') {
      const header = 'id;nome;email;cpf;telefone;cidade;estado;cargo;salario;curso;ativo';
      const rows = data.map(d => 
        `${d.id};"${d.nome}";"${d.email}";"${d.cpf}";"${d.telefone}";"${d.cidade}";"${d.estado}";"${d.cargo}";${d.salario};"${d.curso}";${d.ativo ? '1' : '0'}`
      );
      return [header, ...rows].join('\n');
    }
    return '';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getFormattedOutput());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = getFormattedOutput();
    const ext = outputFormat === 'json' ? 'json' : outputFormat === 'sql' ? 'sql' : 'csv';
    const mime = outputFormat === 'json' ? 'application/json' : 'text/plain';
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mock_data_${tableName}_${data.length}.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      {/* Topo com Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              Gerador de Dados Fictícios (*Mock Data*)
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                {data.length} registros prontos
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Gere dados brasileiros para praticar queries SQL, APIs REST, React e tabelas
            </p>
          </div>
        </div>

        {/* Quantidade Rápida */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Gerar:</span>
          <div className="flex items-center gap-1">
            {[5, 10, 25, 50].map(cnt => (
              <Button
                key={cnt}
                size="sm"
                variant={recordCount === cnt ? 'default' : 'outline'}
                className="h-8 text-xs px-2.5"
                onClick={() => handleRegenerate(cnt)}
              >
                {cnt} itens
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => handleRegenerate(recordCount)}
              title="Recriar com novos nomes"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Seletor de Formato & Painel de Saída */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border">
            <Button
              size="sm"
              variant={outputFormat === 'json' ? 'default' : 'ghost'}
              className="text-xs h-8 gap-1.5"
              onClick={() => setOutputFormat('json')}
            >
              <Braces className="w-3.5 h-3.5" />
              JSON (APIs)
            </Button>
            <Button
              size="sm"
              variant={outputFormat === 'sql' ? 'default' : 'ghost'}
              className="text-xs h-8 gap-1.5"
              onClick={() => setOutputFormat('sql')}
            >
              <Database className="w-3.5 h-3.5" />
              SQL (INSERT INTO)
            </Button>
            <Button
              size="sm"
              variant={outputFormat === 'csv' ? 'default' : 'ghost'}
              className="text-xs h-8 gap-1.5"
              onClick={() => setOutputFormat('csv')}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              CSV / Excel
            </Button>
            <Button
              size="sm"
              variant={outputFormat === 'table' ? 'default' : 'ghost'}
              className="text-xs h-8 gap-1.5"
              onClick={() => setOutputFormat('table')}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Visualizar Tabela
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {outputFormat === 'sql' && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Tabela:</span>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-24 h-8 px-2 rounded-md border border-input bg-background font-mono text-xs"
                />
              </div>
            )}

            {outputFormat !== 'table' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar Tudo'}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={handleDownload}
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar .{outputFormat}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Exibição em Tabela ou Caixa de Texto */}
        {outputFormat === 'table' ? (
          <div className="border rounded-xl overflow-x-auto bg-card shadow-sm">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/80 border-b border-border text-muted-foreground font-semibold">
                  <th className="p-3">#</th>
                  <th className="p-3">Nome Completo</th>
                  <th className="p-3">E-mail</th>
                  <th className="p-3">CPF</th>
                  <th className="p-3">Cidade/UF</th>
                  <th className="p-3">Cargo</th>
                  <th className="p-3">Salário</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono text-muted-foreground">{item.id}</td>
                    <td className="p-3 font-medium text-foreground">{item.nome}</td>
                    <td className="p-3 font-mono text-muted-foreground">{item.email}</td>
                    <td className="p-3 font-mono">{item.cpf}</td>
                    <td className="p-3">{item.cidade}/{item.estado}</td>
                    <td className="p-3">{item.cargo}</td>
                    <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400">R$ {item.salario.toFixed(2)}</td>
                    <td className="p-3">
                      {item.ativo ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Ativo</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">Inativo</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
              <span>Saída Formatada em {outputFormat.toUpperCase()}</span>
              <span>{getFormattedOutput().split('\n').length} linhas</span>
            </div>
            <Textarea
              readOnly
              value={getFormattedOutput()}
              className="w-full font-mono text-xs bg-transparent text-emerald-400 p-4 leading-relaxed border-0 focus-visible:ring-0 resize-y min-h-[350px]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
