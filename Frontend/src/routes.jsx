import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import DeviceRegistration from "./pages/DeviceRegistration";
import PendingApproval from "./pages/PendingApproval";

import AdminDashboard from "./pages/admin/AdminDashboard";
import Dashboard from "./pages/admin/Dashboard";
import UserGroupMaster from "./pages/admin/user/UserGroupMaster";
import CreateUser from "./pages/admin/user/CreateUser";
import CreateUserType from "./pages/admin/user/CreateUserType";
import ClientMaster from "./pages/admin/client/ClientMaster";
import SiteMaster from "./pages/admin/site/SiteMaster";
import RoleMaster from "./pages/admin/role/RoleMaster";
import TrainerMaster from "./pages/admin/trainer/TrainerMaster";
import ActivityReport from "./pages/admin/ActivityReport";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/device-registration" element={<DeviceRegistration />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
            </Route>

            <Route element={<ProtectedRoute allowedRole="admin" requiredMasters={["user_master", "device_approval"]} requiredAction="read" />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRole="admin" />}>
                <Route path="/admin/home" element={<Dashboard />} />
                <Route path="/admin/report" element={<ActivityReport />} />
            </Route>

            <Route element={<ProtectedRoute allowedRole="admin" requiredMaster="user_master" requiredAction="write" />}>
                <Route path="/admin/users/create" element={<CreateUser />} />
            </Route>

            <Route element={<ProtectedRoute allowedRole="admin" requiredMaster="user_type" requiredAction="read" />}>
                <Route path="/admin/user-types" element={<UserGroupMaster />} />
            </Route>

            <Route element={<ProtectedRoute allowedRole="admin" requiredMaster="user_type" requiredAction="write" />}>
                <Route path="/admin/user-types/create" element={<CreateUserType />} />
            </Route>

            <Route element={<ProtectedRoute allowedRole="admin" requiredMaster="client_master" requiredAction="read" />}>
                <Route path="/admin/clients" element={<ClientMaster />} />
            </Route>

            <Route element={<ProtectedRoute allowedRole="admin" requiredMaster="site_master" requiredAction="read" />}>
                <Route path="/admin/sites" element={<SiteMaster />} />
            </Route>

            <Route element={<ProtectedRoute allowedRole="admin" requiredMaster="role_master" requiredAction="read" />}>
                <Route path="/admin/roles" element={<RoleMaster />} />
            </Route>

            <Route element={<ProtectedRoute allowedRole="admin" requiredMaster="trainer_master" requiredAction="read" />}>
                <Route path="/admin/trainers" element={<TrainerMaster />} />
            </Route>

            <Route path="*" element={<Navigate to="/admin/home" replace />} />
        </Routes>
    );
}