import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, TrendingDown, DollarSign, PlusCircle, ArrowUpDown, Loader2, BarChart3, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFinancialTransactions, useCreateTransaction, useFinancialSummary } from "@/hooks/useFinancials";
import { usePayslips } from "@/hooks/usePayslips";
import { useToast } from "@/hooks/use-toast";
import { mapErrorToUserMessage } from "@/lib/error-utils";

export default function AccountsPage() {
  const { user, primaryRole } = useAuth();
  const { toast } = useToast();
  const canManage = ['ceo', 'manager', 'accountant'].includes(primaryRole);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    transaction_type: 'expense' as 'payroll' | 'expense' | 'reimbursement' | 'bonus' | 'deduction',
    amount: '',
    description: '',
    category: '',
    reference_number: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  const { data: transactions, isLoading } = useFinancialTransactions();
  const { data: summary } = useFinancialSummary();
  const { data: payslips } = usePayslips();
  const createTransaction = useCreateTransaction();

  const paidPayslips = payslips?.filter((p: any) => p.status === 'paid') || [];
  const generatedPayslips = payslips?.filter((p: any) => p.status === 'generated') || [];

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newTransaction.amount || Number(newTransaction.amount) <= 0) {
      toast({ title: "Amount must be greater than 0", variant: "destructive" });
      return;
    }

    try {
      await createTransaction.mutateAsync({
        ...newTransaction,
        amount: Number(newTransaction.amount),
        recorded_by: user.id,
      });
      toast({ title: "Transaction recorded" });
      setIsAddDialogOpen(false);
      setNewTransaction({
        transaction_type: 'expense',
        amount: '',
        description: '',
        category: '',
        reference_number: '',
        transaction_date: new Date().toISOString().split('T')[0],
      });
    } catch (err: any) {
      toast({ title: "Error", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'payroll': return <Badge className="bg-primary">Payroll</Badge>;
      case 'expense': return <Badge variant="destructive">Expense</Badge>;
      case 'bonus': return <Badge className="bg-success">Bonus</Badge>;
      case 'deduction': return <Badge className="bg-warning text-warning-foreground">Deduction</Badge>;
      case 'reimbursement': return <Badge variant="secondary">Reimbursement</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Financial monitoring and fund management</p>
        </div>
        {canManage && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><PlusCircle size={18} />Record Transaction</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Transaction</DialogTitle>
                <DialogDescription>Add a financial transaction record</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddTransaction} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newTransaction.transaction_type} onValueChange={(v) => setNewTransaction(p => ({ ...p, transaction_type: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payroll">Payroll</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                      <SelectItem value="deduction">Deduction</SelectItem>
                      <SelectItem value="reimbursement">Reimbursement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (K)</Label>
                    <Input type="number" step="0.01" min="0" value={newTransaction.amount} onChange={(e) => setNewTransaction(p => ({ ...p, amount: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={newTransaction.transaction_date} onChange={(e) => setNewTransaction(p => ({ ...p, transaction_date: e.target.value }))} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={newTransaction.description} onChange={(e) => setNewTransaction(p => ({ ...p, description: e.target.value }))} placeholder="Transaction details..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input value={newTransaction.category} onChange={(e) => setNewTransaction(p => ({ ...p, category: e.target.value }))} placeholder="e.g., Equipment" />
                  </div>
                  <div className="space-y-2">
                    <Label>Reference #</Label>
                    <Input value={newTransaction.reference_number} onChange={(e) => setNewTransaction(p => ({ ...p, reference_number: e.target.value }))} placeholder="INV-001" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={createTransaction.isPending}>
                    {createTransaction.isPending ? 'Recording...' : 'Record'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">K {(summary?.totalPayroll || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{paidPayslips.length} payslips paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payroll</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">K {(summary?.pendingPayroll || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{generatedPayslips.length} payslips awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">K {(summary?.totalExpenses || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All recorded expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deductions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">K {(summary?.totalDeductions || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total deductions applied</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Transactions and Payroll Overview */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payroll">Payroll Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Transaction History
              </CardTitle>
              <CardDescription>All financial transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Recorded By</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions?.map((tx: any) => (
                        <TableRow key={tx.id}>
                          <TableCell>{new Date(tx.transaction_date).toLocaleDateString()}</TableCell>
                          <TableCell>{getTypeBadge(tx.transaction_type)}</TableCell>
                          <TableCell className="font-medium">K {Number(tx.amount).toLocaleString()}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{tx.description || '—'}</TableCell>
                          <TableCell>{tx.category || '—'}</TableCell>
                          <TableCell>{tx.recorder?.full_name || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{tx.reference_number || '—'}</TableCell>
                        </TableRow>
                      ))}
                      {(!transactions || transactions.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No transactions recorded</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Payroll Overview
              </CardTitle>
              <CardDescription>Summary of all payslips by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-sm text-muted-foreground">Generated (Unpaid)</p>
                  <p className="text-2xl font-bold text-warning">{generatedPayslips.length}</p>
                  <p className="text-sm">K {generatedPayslips.reduce((s: number, p: any) => s + Number(p.net_pay), 0).toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="text-2xl font-bold text-success">{paidPayslips.length}</p>
                  <p className="text-sm">K {paidPayslips.reduce((s: number, p: any) => s + Number(p.net_pay), 0).toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-sm text-muted-foreground">Total Payslips</p>
                  <p className="text-2xl font-bold">{payslips?.length || 0}</p>
                  <p className="text-sm">K {payslips?.reduce((s: number, p: any) => s + Number(p.net_pay), 0).toLocaleString() || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
