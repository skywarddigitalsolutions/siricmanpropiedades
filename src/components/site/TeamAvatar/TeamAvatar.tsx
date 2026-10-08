import Image from "next/image";
import type { TeamMember } from "@/lib/public/team";
import styles from "./TeamAvatar.module.css";

type TeamAvatarProps = {
  member: TeamMember;
  /** `sizes` hint for the photo. */
  sizes: string;
  /** Class for the photo, so each page keeps its own framing. */
  imageClassName?: string;
};

/** Team photo, or an initials avatar (gold on navy) when the person has none. */
export default function TeamAvatar({ member, sizes, imageClassName }: TeamAvatarProps) {
  if (member.photo) {
    return (
      <Image
        src={member.photo}
        alt={member.name}
        width={200}
        height={200}
        sizes={sizes}
        className={imageClassName}
      />
    );
  }
  return (
    <span role="img" aria-label={member.name} className={styles.initials}>
      <span aria-hidden="true">{member.initials}</span>
    </span>
  );
}
