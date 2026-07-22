import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FolderTree, Plus, Trash2, Edit3 } from 'lucide-react';
import AdminModal from '../../components/admin/ui/AdminModal';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', type: 'sell', icon: 'Tag', color: '#3B82F6' });

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', type: 'sell', icon: 'Tag', color: '#3B82F6' });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, type: cat.type, icon: cat.icon || 'Tag', color: cat.color || '#3B82F6' });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const res = await api.put(`/admin/categories/${editingCategory._id}`, formData);
        if (res.data.success) toast.success('Category updated');
      } else {
        const res = await api.post('/admin/categories', formData);
        if (res.data.success) toast.success('Category created');
      }
      setModalOpen(false);
      void fetchCategories();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const res = await api.delete(`/admin/categories/${id}`);
      if (res.data.success) {
        toast.success('Category deleted');
        void fetchCategories();
      }
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-[var(--color-primary-500)]" /> System Categories Management
          </h2>
          <p className="text-xs text-[var(--text-tertiary)]">Create and manage item categories across Marketplace and Lost & Found.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] rounded-[var(--radius-md)] shadow-[var(--shadow-xs)] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {isLoading ? (
        <p className="text-center py-10 text-xs text-[var(--text-tertiary)]">Loading categories...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="p-4 rounded-[var(--radius-xl)] bg-[var(--surface-card)] border border-[var(--border-primary)] shadow-[var(--shadow-xs)] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: cat.color || '#3B82F6' }}
                />
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">{cat.name}</h4>
                  <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)]">{cat.type}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => void handleDelete(cat._id)}
                  className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--color-error-500)] hover:bg-[var(--bg-tertiary)] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 text-xs">
          <div>
            <label className="block text-[var(--text-secondary)] font-medium mb-1">Category Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
            />
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-medium mb-1">Module Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              <option value="sell">Sell Marketplace</option>
              <option value="found">Lost & Found</option>
              <option value="ticket">Ticket</option>
              <option value="pass">Pass</option>
            </select>
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-medium mb-1">Badge Color Hex</label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-10 p-1 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-secondary)]">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] font-semibold cursor-pointer"
            >
              Save Category
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
