import Image from "next/image";

export function BrandLogo() {
  return (
    <span className="brand-lockup">
      <Image className="brand-symbol" src="/rai-icon.png" alt="" width={278} height={248} priority />
      <span>RAI</span>
    </span>
  );
}
