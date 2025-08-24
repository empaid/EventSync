import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage(){
    return (
    <main className="min-h-dvh px-4">
      <div className="mx-auto max-w-md pt-10 text-center">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="mt-1 text-sm text-gray-500">Sign in to continue</p>
      </div>
      <LoginForm />
    </main>
  );
}