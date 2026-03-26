import { redirect } from 'next/navigation';
export default function MySwapsRedirect() {
  redirect('/exchange');
  return null;
} 