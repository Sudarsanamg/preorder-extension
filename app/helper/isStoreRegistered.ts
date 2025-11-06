import prisma from "app/db.server";


export const isStoreRegistered = async(storeDomain: string) => {
    const store = await prisma.store.findUnique({
        where: { 
            shopifyDomain: storeDomain
         },
    });
    if(store) {
        return true;
    }
    return false;
};