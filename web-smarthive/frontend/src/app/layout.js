import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Smart Hive | Sistema de Monitoramento de Abelhas Nativas',
  description: 'Sistema Inteligente de Monitoramento de Abelhas Nativas',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}