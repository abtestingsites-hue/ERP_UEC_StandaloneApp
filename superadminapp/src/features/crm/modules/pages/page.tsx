import { redirect } from '../nextShim';

export default function Home() {
  redirect('/dashboard');
}
