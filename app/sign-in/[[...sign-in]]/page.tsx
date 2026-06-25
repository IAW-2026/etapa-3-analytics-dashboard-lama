import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="auth-shell">
      <section className="auth-copy">
        <p className="eyebrow">LAMA Analytics</p>
        <h1>Ingresar al dashboard</h1>
        <p>
          Acceso protegido para consultar metricas consolidadas del sistema completo.
        </p>
      </section>
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" fallbackRedirectUrl="/" />
    </main>
  );
}
