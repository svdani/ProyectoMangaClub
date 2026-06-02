import { createContext, useContext, useState } from "react";

const WishlistContext = createContext<any>(null);

export function WishlistProvider({ children }: any) {
  const [wishlist, setWishlist] = useState<any[]>([]);

  function añadirWishlist(manga: any) {
    const existe = wishlist.find((m) => m.id === manga.id);

    if (existe) return;

    setWishlist([...wishlist, manga]);
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        añadirWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
