import { Suspense } from "react";
import LoginPage from "./login-form";

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
