import { redirect } from 'next/navigation';
export default function SwapsRedirect() {
  redirect('/exchange');
  return null;
} 