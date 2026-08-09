import { useState } from "react";
import { router } from "expo-router";

import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { showAlert } from "@/helpers/alerts/alert.service";

export const useLogin = () => {
  const { login } = useAuthStore();

  const [isPosting, setIsPosting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onChangeForm = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onLogin = async () => {
    const { email, password } = form;

    if (email.length === 0 || password.length === 0) {
      return;
    }

    setIsPosting(true);
    const wasSuccessful = await login(email, password);
    setIsPosting(false);

    if (wasSuccessful) {
      router.replace("/");
      return;
    }

    showAlert("Error", "Usuario o contraseña no son correctos");
  };

  return {
    form,
    isPosting,
    onChangeForm,
    onLogin,
  };
};
