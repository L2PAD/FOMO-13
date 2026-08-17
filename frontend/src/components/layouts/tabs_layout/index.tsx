import React, { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { toast } from "react-toastify";
import Modal from "../../common/modal";
import FileInput from "../../common/file_input";
import loader from "../../services/loader";
import {
  createAdminTab,
  deleteAdminTab,
  fetchAdminTabs,
  IAdminTab,
  IAdminTabColumn,
  reorderAdminTabs,
  toggleAdminTabActive,
  updateAdminTab,
} from "../../services/tabs/adminTabs";
import { TAB_COLUMN_OPTIONS, TAB_TYPE_OPTIONS, formatColumnOptionRu } from "./constants";
import { AdminSelect } from "../../../pages/AdminRating/AdminControls";

const COLUMN_SELECT_OPTIONS = TAB_COLUMN_OPTIONS.map((option) => ({
  value: option.key,
  label: formatColumnOptionRu(option),
}));
import { useStyles } from "./styles";

interface IFormData {
  name: string;
  key: string;
  description: string;
  type: string;
  isActive: boolean;
  isGlobal: boolean;
  sortOrder: number;
  image: string | File | null;
  filtersText: string;
  columns: IAdminTabColumn[];
}

const createEmptyColumn = (order: number): IAdminTabColumn => ({
  key: TAB_COLUMN_OPTIONS[0]?.key || "",
  label: TAB_COLUMN_OPTIONS[0]?.label || "",
  enabled: true,
  order,
  blockName: TAB_COLUMN_OPTIONS[0]?.blockName || "Other",
  name: TAB_COLUMN_OPTIONS[0]?.name || "",
});

const createDefaultForm = (): IFormData => ({
  name: "",
  key: "",
  description: "",
  type: "custom",
  isActive: true,
  isGlobal: true,
  sortOrder: 0,
  image: null,
  filtersText: "{}",
  columns: [createEmptyColumn(0)],
});

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const normalizeColumns = (columns: IAdminTabColumn[]) =>
  columns
    .filter((column) => column.key.trim())
    .map((column, index) => {
      const option = TAB_COLUMN_OPTIONS.find((item) => item.key === column.key);

      return {
        key: column.key.trim(),
        label: column.label.trim() || option?.label || column.key,
        enabled: column.enabled,
        order: Number.isFinite(Number(column.order)) ? Number(column.order) : index,
        blockName: column.blockName || option?.blockName || "Other",
        name: column.name || option?.name || column.label || column.key,
      };
    })
    .sort((a, b) => a.order - b.order)
    .map((column, index) => ({
      ...column,
      order: index,
    }));

const TabsLayout = () => {
  const classes = useStyles();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [formData, setFormData] = useState<IFormData>(createDefaultForm());

  const tabsQuery = useQuery(["admin-tabs", search], () => fetchAdminTabs(search), {
    refetchOnWindowFocus: false,
  });

  const tabs: IAdminTab[] = tabsQuery.data?.data?.items || [];

  const sortedTabs = useMemo(
    () => [...tabs].sort((a, b) => a.sortOrder - b.sortOrder),
    [tabs]
  );

  const resetForm = () => {
    setEditingTabId(null);
    setFormData(createDefaultForm());
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (tab: IAdminTab) => {
    setEditingTabId(tab._id);
    setFormData({
      name: tab.name || "",
      key: tab.key || "",
      description: tab.description || "",
      type: tab.type || "custom",
      isActive: tab.isActive !== false,
      isGlobal: tab.isGlobal !== false,
      sortOrder: Number(tab.sortOrder || 0),
      image: tab.image || null,
      filtersText: JSON.stringify(tab.filters || {}, null, 2),
      columns:
        tab.columns?.length
          ? tab.columns
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((column, index) => ({
                ...column,
                order: Number.isFinite(Number(column.order)) ? Number(column.order) : index,
              }))
          : [createEmptyColumn(0)],
    });
    setIsModalOpen(true);
  };

  const updateColumn = (
    index: number,
    updater: (column: IAdminTabColumn) => IAdminTabColumn
  ) => {
    setFormData((prev) => ({
      ...prev,
      columns: prev.columns.map((column, columnIndex) =>
        columnIndex === index ? updater(column) : column
      ),
    }));
  };

  const moveColumn = (index: number, direction: -1 | 1) => {
    setFormData((prev) => {
      const nextColumns = [...prev.columns];
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= nextColumns.length) {
        return prev;
      }

      [nextColumns[index], nextColumns[nextIndex]] = [
        nextColumns[nextIndex],
        nextColumns[index],
      ];

      return {
        ...prev,
        columns: nextColumns.map((column, columnIndex) => ({
          ...column,
          order: columnIndex,
        })),
      };
    });
  };

  const addColumn = () => {
    setFormData((prev) => ({
      ...prev,
      columns: [...prev.columns, createEmptyColumn(prev.columns.length)],
    }));
  };

  const removeColumn = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      columns: prev.columns
        .filter((_, columnIndex) => columnIndex !== index)
        .map((column, columnIndex) => ({
          ...column,
          order: columnIndex,
        })),
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.key.trim()) {
      toast.error("Укажите название и ключ");
      return;
    }

    if (!formData.columns.length) {
      toast.error("Добавьте хотя бы одну колонку");
      return;
    }

    let parsedFilters: Record<string, any> = {};

    try {
      parsedFilters = formData.filtersText.trim()
        ? JSON.parse(formData.filtersText)
        : {};
    } catch (error) {
      toast.error("Фильтры должны быть корректным JSON");
      return;
    }

    setIsSubmitting(true);

    try {
      const imageValue =
        formData.image instanceof File
          ? await readFileAsBase64(formData.image)
          : formData.image || undefined;

      const payload = {
        name: formData.name.trim(),
        key: formData.key.trim(),
        description: formData.description.trim(),
        type: formData.type.trim() || "custom",
        isActive: formData.isActive,
        isGlobal: formData.isGlobal,
        sortOrder: Number(formData.sortOrder || 0),
        image: imageValue,
        filters: parsedFilters,
        columns: normalizeColumns(formData.columns),
      };

      const response = editingTabId
        ? await updateAdminTab(editingTabId, payload)
        : await createAdminTab(payload);

      if (!response.success) {
        throw new Error("Save failed");
      }

      toast.success(editingTabId ? "Вкладка обновлена" : "Вкладка создана");
      setIsModalOpen(false);
      resetForm();
      await tabsQuery.refetch();
    } catch (error) {
      toast.error("Не удалось сохранить вкладку");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tab: IAdminTab) => {
    if (!window.confirm(`Удалить вкладку «${tab.name}»?`)) {
      return;
    }

    const response = await deleteAdminTab(tab._id);

    if (!response.success) {
      toast.error("Не удалось удалить вкладку");
      return;
    }

    toast.success("Вкладка удалена");
    await tabsQuery.refetch();
  };

  const handleToggleActive = async (tab: IAdminTab) => {
    const response = await toggleAdminTabActive(tab._id);

    if (!response.success) {
      toast.error("Не удалось изменить статус");
      return;
    }

    toast.success(tab.isActive ? "Вкладка выключена" : "Вкладка включена");
    await tabsQuery.refetch();
  };

  const handleMoveTab = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= sortedTabs.length) {
      return;
    }

    const reordered = [...sortedTabs];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];

    const response = await reorderAdminTabs(
      reordered.map((tab, tabIndex) => ({
        id: tab._id,
        sortOrder: tabIndex,
      }))
    );

    if (!response.success) {
      toast.error("Не удалось изменить порядок");
      return;
    }

    await tabsQuery.refetch();
  };

  return (
    <div className={classes.page}>
      <div className={classes.header}>
        <div className={classes.titleBlock}>
          <h1>Вкладки</h1>
          <p>Создавайте и настраивайте глобальные вкладки Market, которые видят все пользователи.</p>
        </div>
        <div className={classes.headerActions}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по названию, ключу или типу"
          />
          <button onClick={openCreateModal}>+ Создать вкладку</button>
        </div>
      </div>

      <div className={classes.card}>
        <div className={classes.tableHead}>
          <div>Вкладка</div>
          <div>Тип</div>
          <div>Статус</div>
          <div>Видимость</div>
          <div>Колонки</div>
          <div>Действия</div>
        </div>

        {sortedTabs.length ? (
          sortedTabs.map((tab, index) => (
            <div className={classes.tableRow} key={tab._id}>
              <div className={classes.tabMeta}>
                {tab.image ? <img src={loader(tab.image)} alt={tab.name} /> : null}
                <div>
                  <strong>{tab.name}</strong>
                  <p>{tab.key} | сорт. {tab.sortOrder}</p>
                  {tab.description ? <p>{tab.description}</p> : null}
                </div>
              </div>
              <div>{tab.type || "custom"}</div>
              <div>
                <span
                  className={`${classes.tag} ${
                    tab.isActive ? classes.activeTag : classes.inactiveTag
                  }`}
                >
                  {tab.isActive ? "Активна" : "Выключена"}
                </span>
              </div>
              <div>
                <span className={`${classes.tag} ${classes.globalTag}`}>
                  {tab.isGlobal ? "Глобальная" : "Локальная"}
                </span>
              </div>
              <div>{tab.columns?.length || 0}</div>
              <div className={classes.rowActions}>
                <button onClick={() => openEditModal(tab)}>Изменить</button>
                <button onClick={() => handleToggleActive(tab)}>
                  {tab.isActive ? "Выключить" : "Включить"}
                </button>
                <button onClick={() => handleMoveTab(index, -1)}>Вверх</button>
                <button onClick={() => handleMoveTab(index, 1)}>Вниз</button>
                <button
                  className={classes.dangerButton}
                  onClick={() => handleDelete(tab)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={classes.emptyState}>
            {tabsQuery.isLoading ? "Загрузка вкладок..." : "Вкладки ещё не созданы"}
          </div>
        )}
      </div>

      {isModalOpen ? (
        <Modal
          title={editingTabId ? "Редактировать вкладку" : "Создать вкладку"}
          variant="big"
          onClose={() => {
            setIsModalOpen(false);
            resetForm();
          }}
        >
          <div className={classes.modalBody}>
            <div className={classes.formGrid}>
              <label>
                Название
                <input
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Например: В тренде"
                />
              </label>
              <label>
                Ключ
                <input
                  value={formData.key}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, key: event.target.value }))
                  }
                  placeholder="trending"
                />
              </label>
              <label className={classes.fullWidth}>
                Описание
                <textarea
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Кратко опишите, что показывает эта вкладка"
                />
              </label>
              <label>
                Тип
                <AdminSelect
                  value={formData.type || "custom"}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, type: v }))
                  }
                  options={
                    TAB_TYPE_OPTIONS.some((o) => o.value === formData.type) || !formData.type
                      ? TAB_TYPE_OPTIONS
                      : [...TAB_TYPE_OPTIONS, { value: formData.type, label: formData.type }]
                  }
                  ariaLabel="Тип вкладки"
                  testid="tab-type-select"
                />
              </label>
              <label>
                Порядок сортировки
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      sortOrder: Number(event.target.value || 0),
                    }))
                  }
                />
              </label>
              <div className={classes.fullWidth}>
                <FileInput
                  data={{ image: formData.image }}
                  inputsHandler={(value: File) =>
                    setFormData((prev) => ({ ...prev, image: value }))
                  }
                  inputLabel="Изображение вкладки"
                />
              </div>
            </div>

            <div className={classes.switches}>
              <label className={classes.switchLabel}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
                  }
                />
                Активна
              </label>
              <label className={classes.switchLabel}>
                <input
                  type="checkbox"
                  checked={formData.isGlobal}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, isGlobal: !prev.isGlobal }))
                  }
                />
                Глобальная
              </label>
            </div>

            <div className={classes.columnsBlock}>
              <div className={classes.columnsHeader}>
                <h3>Колонки</h3>
                <button onClick={addColumn}>+ Добавить колонку</button>
              </div>

              {formData.columns.length === 0 ? (
                <div className={classes.columnsEmpty}>
                  Колонки не добавлены. Нажмите «Добавить колонку», чтобы настроить отображение на Market.
                </div>
              ) : null}

              {formData.columns.map((column, index) => (
                <div className={classes.columnRow} key={`${column.key}-${index}`}>
                  <AdminSelect
                    value={column.key}
                    searchable
                    options={COLUMN_SELECT_OPTIONS}
                    ariaLabel="Колонка"
                    onChange={(v) => {
                      const option = TAB_COLUMN_OPTIONS.find(
                        (item) => item.key === v
                      );

                      updateColumn(index, (current) => ({
                        ...current,
                        key: v,
                        label: option?.label || current.label,
                        blockName: option?.blockName || current.blockName,
                        name: option?.name || current.name,
                      }));
                    }}
                  />
                  <input
                    value={column.label}
                    onChange={(event) =>
                      updateColumn(index, (current) => ({
                        ...current,
                        label: event.target.value,
                      }))
                    }
                    placeholder="Подпись"
                  />
                  <input
                    type="number"
                    value={column.order}
                    title="Порядок"
                    onChange={(event) =>
                      updateColumn(index, (current) => ({
                        ...current,
                        order: Number(event.target.value || 0),
                      }))
                    }
                  />
                  <label className={classes.enabledBox}>
                    <input
                      type="checkbox"
                      checked={column.enabled}
                      onChange={() =>
                        updateColumn(index, (current) => ({
                          ...current,
                          enabled: !current.enabled,
                        }))
                      }
                    />
                    Вкл
                  </label>
                  <div className={classes.columnActions}>
                    <button onClick={() => moveColumn(index, -1)} title="Вверх">↑</button>
                    <button onClick={() => moveColumn(index, 1)} title="Вниз">↓</button>
                    <button onClick={() => removeColumn(index)} className={classes.dangerButton} title="Удалить">✕</button>
                  </div>
                </div>
              ))}
            </div>

            <div className={classes.modalActions}>
              <button
                className={classes.secondaryButton}
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                Отмена
              </button>
              <button
                className={classes.primaryButton}
                disabled={isSubmitting}
                onClick={handleSave}
              >
                {isSubmitting ? "Сохранение..." : editingTabId ? "Сохранить" : "Создать вкладку"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
};

export default TabsLayout;
