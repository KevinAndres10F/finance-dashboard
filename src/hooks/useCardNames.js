import { useMemo } from 'react';
import { useAccounts } from './useAccounts';

/**
 * Nombres de las cuentas que son tarjeta de crédito.
 * Se usan para reconocer los pagos de tarjeta y no contarlos como gasto.
 */
export function useCardNames(transactions = []) {
  const { accounts } = useAccounts(transactions);
  return useMemo(
    () => accounts.filter(a => a.type === 'credit_card').map(a => a.name),
    [accounts]
  );
}
