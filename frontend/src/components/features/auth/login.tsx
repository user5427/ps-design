import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { AuthFormLayout } from "@/components/elements/auth";
import { URLS } from "@/constants/urls";
import { useLogin } from "@/hooks/auth/auth-hooks";
import { getReadableError } from "@/utils/get-readable-error";
import { createForm } from "@/components/elements/form-builder";
import { useMessageManager } from "@/components/elements/message-manager";
import { FormText } from "@/components/elements/form-builder";
import { FormCard } from "@/components/elements/form-decorator";
import type { FormHandle } from "@/components/elements/list-manager";

const LoginFormContent = ({ form }: { form: any }) => (
  <>
    <form.Field
      name="email"
      defaultValue=""
      validators={{
        onChange: ({ value }: any) => {
          if (!value || String(value).trim().length === 0) {
            return "Email is required";
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(value))) {
            return "Please enter a valid email";
          }
          return undefined;
        },
      }}
    >
      {(field: any) => (
        <FormText
          fieldName="email"
          label="Email"
          value={field.state.value}
          onChange={field.handleChange}
          onBlur={field.handleBlur}
          error={field.state.meta.errors.length > 0}
          helperText={field.state.meta.errors[0] || ""}
          type="email"
          required
        />
      )}
    </form.Field>

    <form.Field
      name="password"
      defaultValue=""
      validators={{
        onChange: ({ value }: any) => {
          if (!value || String(value).trim().length === 0) {
            return "Password is required";
          }
          return undefined;
        },
      }}
    >
      {(field: any) => (
        <FormText
          fieldName="password"
          label="Password"
          value={field.state.value}
          onChange={field.handleChange}
          onBlur={field.handleBlur}
          error={field.state.meta.errors.length > 0}
          helperText={field.state.meta.errors[0] || ""}
          type="password"
          required
        />
      )}
    </form.Field>
  </>
);

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const messageManager = useMessageManager();
  const loginMutation = useLogin();

  const { ref: formRef, Component: FormComponent } = createForm({
    children: LoginFormContent,
    messageManager,
    onSubmit: async (values) => {
      try {
        loginMutation.mutate({
          email: String(values.email),
          password: String(values.password),
        });
      } catch (error) {
        messageManager.addMessage("Login failed", "error", 3000);
      }
    },
  });

  useEffect(() => {
    if (loginMutation.isSuccess && loginMutation.data) {
      const { isPasswordResetRequired } = loginMutation.data;
      messageManager.addMessage("Login successful", "success", 2000);
      setTimeout(() => {
        if (isPasswordResetRequired) {
          navigate({ to: URLS.CHANGE_PASSWORD });
        } else {
          navigate({ to: URLS.DASHBOARD });
        }
      }, 500);
    }
  }, [loginMutation.isSuccess, loginMutation.data, navigate, messageManager]);

  useEffect(() => {
    if (loginMutation.isError) {
      const errorMessage = getReadableError(
        loginMutation.error,
        "Incorrect credentials. Please try again.",
      );
      messageManager.addMessage(errorMessage, "error", 3000);
    }
  }, [loginMutation.isError, loginMutation.error, messageManager]);

  const formRefWrapper = useRef<FormHandle>({
    setVisible: (visible) => {
      formRef.current?.setVisible(visible);
    },
    submit: async () => await formRef.current?.submit(),
  });

  return (
    <AuthFormLayout title="Sign In">
      <FormCard
        formRef={formRefWrapper}
        submitLabel="Login"
        onSuccess={() => {}}
      >
        <FormComponent />
      </FormCard>
    </AuthFormLayout>
  );
};
