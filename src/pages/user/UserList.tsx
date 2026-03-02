import { Edit, XCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

import { User } from "./types";
import { UserAPI } from "../../lib/api";
import DataTable from "../../components/DataTable";

type UserListProps = {
  searchTerm: string;
  roleFilter: string;
  setTotal: (value: number) => void;
  setCount: (value: number) => void;
  handleEdit: (value: User) => void;
};

const UserList = ({
  searchTerm,
  roleFilter,
  setTotal,
  setCount,
  handleEdit,
}: UserListProps) => {
  /* code structure should follow this
    
    1. state
    2. helper functions
    3. use Effects
    4. handle side effects
    5. render html
    */

  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<User[]>([]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userData = await UserAPI.getUsers(searchTerm, roleFilter);
      setTotal(userData?.total);
      setCount(userData?.count);
      setUserData(userData.data);
    } catch (error: any) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  // for search we load using this
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadUsers();
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const columns = [
    { key: "full_name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "client_login_url", label: "Login URL", sortable: true },
    {
      key: "role",
      label: "Role",
      render: (val: string) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
            val
              ? "bg-green-50 text-green-700 border border-green-100"
              : "bg-red-50 text-red-700 border border-red-100"
          }`}
        >
          {val === "Client" ? "Client" : "Admin"}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (val: boolean) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
            val
              ? "bg-green-50 text-green-700 border border-green-100"
              : "bg-red-50 text-red-700 border border-red-100"
          }`}
        >
          {val ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: User) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          {/* <button
            // onClick={() => handleToggleStatus(row)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.is_active
                ? "hover:bg-red-100 text-red-600"
                : "hover:bg-green-100 text-green-600"
            }`}
            title={row.is_active ? "Deactivate" : "Activate"}
          >
            {row.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
          </button> */}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={userData} isLoading={loading} />
    </>
  );
};

export default UserList;
