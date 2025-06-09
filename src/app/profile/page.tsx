
import { Metadata } from 'next'
import ClientProfilePage from './client-profile'

export const metadata: Metadata = {
  title: 'Профиль | Менариум',
  description: 'Личный кабинет пользователя',
}

export default function ProfilePage() {
  return <ClientProfilePage />
}
