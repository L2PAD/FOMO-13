import React from "react";
import { Portal } from "./AdminControls";
import ReferenceManager from "./ReferenceManager";
import { REFERENCE_TITLES } from "./referenceSchemas";
import { useStyles } from "./styles";

const DESCRIPTIONS: Record<string, string> = {
  rating_crises: "Система проверяет, работал ли фонд в период каждого активного кризиса, и оценивает его состояние по заданным критериям.",
  rating_jurisdictions: "Балл регулирования и модификатор прозрачности рассчитываются по юрисдикции сущности.",
  rating_tier_registry: "Ручные назначения Tier-1 для доверенных сущностей с периодом действия и обоснованием.",
  rating_red_flag_catalog: "Каталог красных флагов и штрафов, применяемых к рейтингу при подтверждённых доказательствах.",
  rating_role_catalog: "Веса ролей персон, влияющие на оценку вовлечённости в проекты.",
  rating_partnership_types: "Значимость типов партнёрств для оценки персоны.",
  rating_media_source_tiers: "Веса тиров медиаисточников для оценки медиаактивности.",
};

/** Slide-over drawer that hosts a single reference catalog in-context. */
const ReferenceDrawer = ({
  catalog,
  onClose,
}: {
  catalog: string | null;
  onClose: () => void;
}) => {
  const classes = useStyles();
  if (!catalog) return null;
  return (
    <Portal>
      <div className={classes.drawerOverlay} data-testid="reference-drawer" onClick={onClose}>
        <aside className={classes.drawerPanel} onClick={(e) => e.stopPropagation()}>
          <div className={classes.drawerHead}>
            <div>
              <h3 style={{ margin: 0 }}>{REFERENCE_TITLES[catalog] || catalog}</h3>
              <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "#7A879A", lineHeight: "17px", maxWidth: 520 }}>
                {DESCRIPTIONS[catalog]}
              </p>
            </div>
            <button className={classes.smallBtn} title="Закрыть" data-testid="drawer-close" onClick={onClose}>×</button>
          </div>
          <div className={classes.drawerBody}>
            <ReferenceManager catalog={catalog} />
          </div>
        </aside>
      </div>
    </Portal>
  );
};

export default ReferenceDrawer;
