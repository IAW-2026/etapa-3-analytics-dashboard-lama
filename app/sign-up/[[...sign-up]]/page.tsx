import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="auth-shell">
      <section className="auth-copy">
        <p className="eyebrow">LAMA Analytics</p>
        <h1>Crear acceso</h1>
        <p>
          Registrate para acceder a reportes operativos y metricas de negocio.
        </p>
      </section>
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" fallbackRedirectUrl="/" />
    </main>
  );
}
