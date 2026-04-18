import { redirect } from 'next/navigation'

/** Old URL — send visitors to the ISA calculator at `/isa`. */
export default function LegacyIsaCalculatorRedirect() {
  redirect('/isa')
}
