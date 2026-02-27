import { Search, X, Plus, Loader2, Triangle } from "lucide-react";
import { useState } from "react";

import { FilterSelect } from "../../components/Filter";
import UserList from "./UserList";
import Drawer from "../../components/Drawer";
import { User as UserType } from "./types";

const User = () => {
  // fillter related states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // move this to create or update page
  const [editUser, setEditUser] = useState<UserType | null>(null);
  const [submitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<UserType>>({
    email: "",
    full_name: "",
    role: "client",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // create page edit functions
  const handleEdit = (data: UserType) => {
    console.log(data);
    setIsDrawerOpen(true);
    setFormData(data);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const getFullName = () => formData.full_name?.trim() || "";
    const getEmail = () => formData.email?.trim() || "";

    if (!getFullName()) {
      newErrors.full_name = "User Name is required";
    }
    if (!getEmail()) {
      newErrors.email = "Email required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      email: "",
      full_name: "",
      role: "client",
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    console.log(formData);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 -mb-4">
        {/* level 1 header */}

        <div className="flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            User
          </h1>
          <p className="text-gray-600 mt-1">User's Informations</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto flex-1 justify-end">
          <div className="relative w-full md:w-[500px] lg:w-[600px] transition-all duration-300">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search Clients"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-full text-base shadow-sm hover:shadow-md focus:shadow-md focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-gray-400 italic"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <button
            className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600
           text-white rounded-full hover:bg-blue-700 transition-all shadow-md shadow-blue-100 fon
           t-bold whitespace-nowrap"
            onClick={() => {
              setIsDrawerOpen(true);
            }}
          >
            <Plus size={20} />
            Add User
          </button>
        </div>
      </div>

      {/* level 2 header -> filters */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <FilterSelect
              options={["Admin", "Client"]}
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="Select Role"
            />
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-4 border-gray-100"></div>
        </div>
      </div>

      {/* level 3 header -> clear filter option and meta data */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-500 italic">
          {searchTerm || roleFilter ? (
            <span>
              Showing <strong>{count}</strong> matching results out of {total}{" "}
              total users
            </span>
          ) : (
            <span>
              Showing all <strong>{total}</strong> vendors
            </span>
          )}
        </p>
        {(searchTerm || roleFilter) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setRoleFilter("");
            }}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* body section */}

      <UserList
        searchTerm={searchTerm}
        roleFilter={roleFilter}
        setTotal={setTotal}
        setCount={setCount}
        handleEdit={handleEdit}
      />

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditUser(null);
        }}
        title={editUser ? "Edit User" : "Add User"}
      >
        <div className="p-6 pb-15  space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* User Full Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => {
                    setFormData({ ...formData, full_name: e.target.value });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-all ${
                    errors.full_name
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="Enter name"
                />
                {errors.full_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.full_name}
                  </p>
                )}
              </div>

              {/* Email  */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-all ${
                    errors.email
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="Enter Email"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            </div>
          </div>
          {/* cancel and submit buttons */}
          <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6  shadow-lg flex gap-3">
            <button
              onClick={() => {
                setIsDrawerOpen(false);
                setEditUser(null);
                resetForm();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                submitting
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-blue-700"
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>{editUser ? "Update" : "Add"} User</>
              )}
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default User;
