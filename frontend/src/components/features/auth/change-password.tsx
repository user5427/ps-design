import { Alert } from "@mui/material";
import { useRef, useState } from "react";
import {
  PasswordRequirements,
  PasswordStrengthIndicator,
} from "@/components/elements/auth";
import { useChangePassword } from "@/queries/auth";
import { checkPasswordStrength } from "@/utils/auth";
import { getReadableError } from "@/utils/get-readable-error";
import { createForm } from "@/components/elements/form-builder";
import { useMessageManager } from "@/components/elements/message-manager";
import { FormText } from "@/components/elements/form-builder";
import { FormCard } from "@/components/elements/form-decorator";
import type { FormHandle } from "@/components/elements/list-manager";

const ChangePasswordFormContent = ({
  form,
  passwordStrength,
  setPasswordStrength,
  passwordsMatch,
}: {
  form: any;
  passwordStrength: any;
  setPasswordStrength: any;
  passwordsMatch: boolean;
}) => {
  const newPwdValue = form.getFieldValue("newPassword");

  return (
    <>
      <form.Field
        name="currentPassword"
        defaultValue=""
        validators={{
          onChange: ({ value }: any) => {
            if (!value || String(value).trim().length === 0) {
              return "Current password is required";
            }
            return undefined;
          },
        }}
      >
        {(field: any) => (
          <FormText
            fieldName="currentPassword"
            label="Current Password"
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

      <form.Field
        name="newPassword"
        defaultValue=""
        validators={{
          onChange: ({ value }: any) => {
            if (!value || String(value).trim().length === 0) {
              return "New password is required";
            }
            return undefined;
          },
        }}
      >
        {(field: any) => (
          <>
            <FormText
              fieldName="newPassword"
              label="New Password"
              value={field.state.value}
              onChange={(value: any) => {
                field.handleChange(value);
                setPasswordStrength(checkPasswordStrength(String(value)));
              }}
              onBlur={field.handleBlur}
              error={field.state.meta.errors.length > 0}
              helperText={field.state.meta.errors[0] || ""}
              type="password"
              required
            />
            {field.state.value.length > 0 && (
              <PasswordStrengthIndicator
                score={passwordStrength.score}
                feedback={passwordStrength.feedback}
              />
            )}
          </>
        )}
      </form.Field>

      <form.Field
        name="confirmPassword"
        defaultValue=""
        validators={{
          onChange: ({ value }: any) => {
            if (!value || String(value).trim().length === 0) {
              return "Please confirm your password";
            }
            return undefined;
          },
        }}
      >
        {(field: any) => (
          <>
            <FormText
              fieldName="confirmPassword"
              label="Confirm Password"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={field.state.meta.errors.length > 0 || (!passwordsMatch && field.state.value.length > 0)}
              helperText={
                field.state.meta.errors[0] || (!passwordsMatch && field.state.value.length > 0 ? "Passwords do not match" : "")
              }
              type="password"
              required
            />
          </>
        )}
      </form.Field>

      {!passwordStrength.isValid && newPwdValue.length > 0 && (
        <Alert sx={{ mb: 2, mt: 2 }}>
          <PasswordRequirements feedback={passwordStrength.feedback} />
        </Alert>
      )}
    </>
  );
};

export const ChangePassword = () => {
  const [passwordStrength, setPasswordStrength] = useState(
    checkPasswordStrength(""),
  );
  const changePasswordMutation = useChangePassword();
  const messageManager = useMessageManager();

  const { ref: formRef, Component: FormComponent } = createForm({
    children: (props: any) => (
      <ChangePasswordFormContent
        {...props}
        passwordStrength={passwordStrength}
        setPasswordStrength={setPasswordStrength}
        passwordsMatch={
          props.form.getFieldValue("newPassword") ===
          props.form.getFieldValue("confirmPassword")
        }
      />
    ),
    messageManager,
    onSubmit: async (values) => {
      const newPassword = String(values.newPassword);
      const confirmPassword = String(values.confirmPassword);

      if (newPassword !== confirmPassword) {
        messageManager.addMessage("Passwords do not match", "error", 3000);
        return;
      }

      if (!passwordStrength.isValid) {
        messageManager.addMessage(
          "Password does not meet requirements",
          "error",
          3000,
        );
        return;
      }

      try {
        await changePasswordMutation.mutateAsync({
          currentPassword: String(values.currentPassword),
          newPassword: newPassword,
        });
        messageManager.addMessage("Password changed successfully", "success", 3000);
        formRef.current?.setVisible(false);
      } catch (error) {
        const errorMessage = getReadableError(
          error,
          "Failed to change password",
        );
        messageManager.addMessage(errorMessage, "error", 3000);
      }
    },
  });

  const formRefWrapper = useRef<FormHandle>({
    setVisible: (visible) => {
      formRef.current?.setVisible(visible);
    },
    submit: async () => await formRef.current?.submit(),
  });

  return (
    <FormCard
      title="Change Password"
      formRef={formRefWrapper}
      submitLabel="Change Password"
      onSuccess={() => {}}
      sx={{
        width: "100%",
        maxWidth: "360px",
        margin: "0 auto",
      }}
    >
      <FormComponent />
    </FormCard>
  );
};
