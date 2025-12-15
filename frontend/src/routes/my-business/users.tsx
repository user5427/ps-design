import { createFileRoute, redirect } from "@tanstack/react-router";
import { UsersManagement } from "@/components/features/manage/users";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";
import { useAuthUser } from "@/hooks/auth";

export const Route = createFileRoute("/my-business/users")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.LOGIN });
    }
  },
  component: MyBusinessUsersPage,
});

function MyBusinessUsersPage() {
  const { data: currentUser } = useAuthUser();
  
  if (!currentUser?.businessId) {
    return <div>You must be associated with a business to view users.</div>;
  }

  return (
    <UsersManagement 
      businessId={currentUser.businessId} 
      disableDelete={true}
      disableCreate={true}
    />
  );
}
