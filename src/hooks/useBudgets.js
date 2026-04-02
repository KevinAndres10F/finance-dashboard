import { useState, useMemo } from 'react';

export function useBudgets(transactions) {
  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('finance-budgets');
    return saved ? JSON.parse(saved) : [];
  });

  const currentMonthExpenses = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return transactions
      .filter(t => t.Fecha?.startsWith(currentMonth) && (t.Tipo === 'Gasto' || t.Monto < 0))
      .reduce((acc, t) => {
        const cat = t.Categoría || 'Otros';
        acc[cat] = (acc[cat] || 0) + Math.abs(Number(t.Monto));
        return acc;
      }, {});
  }, [transactions]);

  const budgetData = useMemo(() => budgets.map(budget => {
    const spent = currentMonthExpenses[budget.category] || 0;
    const percentage = (spent / budget.limit) * 100;
    const remaining = budget.limit - spent;
    const status = percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good';
    return { ...budget, spent, percentage: Math.min(percentage, 100), remaining, status };
  }), [budgets, currentMonthExpenses]);

  const addBudget = (budget) => {
    const newBudget = { id: Date.now(), ...budget };
    const updated = [...budgets, newBudget];
    setBudgets(updated);
    localStorage.setItem('finance-budgets', JSON.stringify(updated));
  };

  const removeBudget = (id) => {
    const updated = budgets.filter(b => b.id !== id);
    setBudgets(updated);
    localStorage.setItem('finance-budgets', JSON.stringify(updated));
  };

  const budgetsInWarning = budgetData.filter(b => b.status === 'warning');
  const budgetsExceeded = budgetData.filter(b => b.status === 'exceeded');

  return { budgets, budgetData, addBudget, removeBudget, budgetsInWarning, budgetsExceeded };
}
