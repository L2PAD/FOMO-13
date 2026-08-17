import React, { useMemo, useState, useCallback, useEffect, FC } from "react";
import styles from "./project-filter.module.scss";
import Image from "next/image";
import imageLoader from "../../../../../../helpers/imageLoader";
import {
  FacebookIcon,
  LinkedinIcon,
  TwitterIcon,
} from "../../../../../global/Icons";

const ProjectFilter: FC<any> = ({ filtersInitialState, project }) => {
  const [filters, setFilters] = useState(filtersInitialState);
  const [filter, setFilter] = useState(filtersInitialState[0].title);

  const filtersHandler = useCallback(
    (event: any) => {
      if (event.target.id === "block") return;

      const target = event.target.textContent;
      setFilters(
        filters.map((filter: any) => {
          if (filter.title === target) {
            return { ...filter, isSelect: true };
          }
          return { ...filter, isSelect: false };
        })
      );
      setFilter(target);
    },
    [filters, filter]
  );

  const data = useMemo(() => {
    return project[filter.toLowerCase()];
  }, [filter]);

  useEffect(() => {
    const actualFilter = filters.find((filter: any) => {
      return project[filter.title.toLowerCase()]?.length;
    });
    setFilter(actualFilter?.title || "");
    setFilters(
      filters.map((filter: any) => {
        if (filter.title === actualFilter) {
          return { ...filter, isSelect: true };
        }
        return { ...filter, isSelect: false };
      })
    );
  }, []);

  return (
    <>
      <div id="block" onClick={filtersHandler} className={styles.filters}>
        {filters
          .filter((filter: any) => project[filter.title.toLowerCase()]?.length)
          .map((filterItem: any, index: number) => {
            return (
              <button
                className={
                  filterItem.title.toLowerCase() === filter.toLowerCase()
                    ? styles.filterBtnSelected
                    : styles.filterBtn
                }
                key={filterItem.title}
              >
                {filterItem.title}
              </button>
            );
          })}
      </div>
      <div className={styles.infoBlock}>
        {data?.length ? (
          data.map((item: any, index: any) => {
            return (
              <div key={index} className={styles.item}>
                <div className={styles.img}>
                  {item.logo ? (
                    <Image
                      loader={() => imageLoader(item.logo)}
                      width="64"
                      height="64"
                      src={item.logo}
                      alt={item.name}
                    />
                  ) : (
                    <></>
                  )}
                </div>
                <div className={styles.name}>{item.name}</div>
                <div className={styles.text}>{item.banner}</div>
                <div className={styles.description}>{item.bio}</div>
                <div className={styles.socialmedia}>
                  {item.twitter ? (
                    <div className={styles.socialitem}>
                      <a href={item.twitter} target="_blank" rel="noreferrer">
                        <TwitterIcon />
                      </a>
                    </div>
                  ) : (
                    <></>
                  )}
                  {item.linkedin ? (
                    <div className={styles.socialitem}>
                      <a href={item.linkedin} target="_blank" rel="noreferrer">
                        <LinkedinIcon />
                      </a>
                    </div>
                  ) : (
                    <></>
                  )}
                  {item.facebook ? (
                    <div className={styles.socialitem}>
                      <a href={item.facebook} target="_blank" rel="noreferrer">
                        <FacebookIcon />
                      </a>
                    </div>
                  ) : (
                    <></>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <></>
        )}
      </div>
    </>
  );
};

export default ProjectFilter;
