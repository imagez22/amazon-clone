import { db } from '../firebaseConfig';
import { collection, getDocs, getDoc, doc, query, where, addDoc, updateDoc, setDoc, orderBy, limit } from 'firebase/firestore';
import { Product, Category, Cart, Order, Wishlist, Banner, ProductFilter, Review } from '../types';

// Helper to simulate Axios response structure
const response = <T>(data: T) => ({ data });

export const productAPI = {
    getAll: async () => {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        return response(products);
    },
    getById: async (id: number | string) => {
        const docRef = doc(db, 'products', id.toString());
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return response({ id: docSnap.id, ...docSnap.data() } as Product);
        }
        throw new Error('Product not found');
    },
    getByCategory: async (categoryId: string) => {
        const q = query(collection(db, 'products'), where('categoryId', '==', categoryId));
        const querySnapshot = await getDocs(q);
        const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        return response(products);
    },
    getCategories: async () => {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        // Sort by order
        categories.sort((a, b) => a.order - b.order);
        return response(categories);
    },
    getBanners: async () => {
        const querySnapshot = await getDocs(collection(db, 'banners'));
        const banners = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
        return response(banners);
    },
    getByFilter: async (filter: ProductFilter) => {
        let q = collection(db, 'products') as any;
        const constraints: any[] = [];

        // 1. Filtering
        if (filter.categoryId) {
            constraints.push(where('categoryId', '==', filter.categoryId));
        }

        if (filter.subCategoryId) {
            constraints.push(where('subCategoryId', '==', filter.subCategoryId));
        }

        if (filter.brand) {
            constraints.push(where('brand', '==', filter.brand));
        }

        if (filter.isDeal) {
            constraints.push(where('isDeal', '==', true));
        }

        // Note: Firestore allows range filters on only one field.
        // We prioritize price if both are present, or handle one in memory if needed.
        // Here we assume simple cases or that the UI prevents conflicting filters.
        if (filter.minPrice !== undefined) {
            constraints.push(where('price', '>=', filter.minPrice));
        }
        if (filter.maxPrice !== undefined) {
            constraints.push(where('price', '<=', filter.maxPrice));
        }

        if (filter.minRating !== undefined && filter.minPrice === undefined && filter.maxPrice === undefined) {
            constraints.push(where('rating', '>=', filter.minRating));
        }

        // 2. Sorting
        // Firestore requires the field used in range filter to be the first sort field.
        if (filter.sortOrder) {
            switch (filter.sortOrder) {
                case 'price_asc':
                    constraints.push(orderBy('price', 'asc'));
                    break;
                case 'price_desc':
                    constraints.push(orderBy('price', 'desc'));
                    break;
                case 'rating_desc':
                    constraints.push(orderBy('rating', 'desc'));
                    break;
                case 'newest':
                    // Assuming 'createdAt' exists, otherwise fallback or remove
                    // constraints.push(orderBy('createdAt', 'desc')); 
                    break;
            }
        }

        q = query(q, ...constraints);
        const querySnapshot = await getDocs(q);
        let products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Product));

        // Client-side text search filtering
        // Note: Firestore doesn't support full-text search natively.
        // For production apps, consider using Algolia, Typesense, or Elasticsearch.
        if (filter.query) {
            const lowerQuery = filter.query.toLowerCase();
            products = products.filter(p => p.name.toLowerCase().includes(lowerQuery));
        }

        return response(products);
    },
    getBrands: async () => {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const products = querySnapshot.docs.map(doc => doc.data() as Product);
        const brands = Array.from(new Set(products.map(p => p.brand))).sort();
        return response(brands);
    },
};

export const cartAPI = {
    getCart: async (userId: string) => {
        const q = query(collection(db, 'carts'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const carts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cart));
        return response(carts);
    },
    addToCart: async (cartData: any) => {
        const docRef = await addDoc(collection(db, 'carts'), cartData);
        return response({ id: docRef.id, ...cartData });
    },
    updateCart: async (id: string, data: any) => {
        const docRef = doc(db, 'carts', id);
        await updateDoc(docRef, data);
        return response(data);
    },
};

export const orderAPI = {
    create: async (orderData: any) => {
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        return response({ id: docRef.id, ...orderData });
    },
    getByUser: async (userId: string) => {
        const q = query(collection(db, 'orders'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        return response(orders);
    },
    getById: async (id: number | string) => {
        const docRef = doc(db, 'orders', id.toString());
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return response({ id: docSnap.id, ...docSnap.data() } as Order);
        }
        throw new Error('Order not found');
    },
};

export const wishlistAPI = {
    getByUser: async (userId: string) => {
        const q = query(collection(db, 'wishlist'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const wishlists = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wishlist));
        return response(wishlists);
    },
    create: async (data: any) => {
        const docRef = await addDoc(collection(db, 'wishlist'), data);
        return response({ id: docRef.id, ...data });
    },
    update: async (id: string, data: any) => {
        const docRef = doc(db, 'wishlist', id);
        await updateDoc(docRef, data);
        return response(data);
    }
};

export const reviewAPI = {
    getByProduct: async (productId: string) => {
        const q = query(collection(db, 'reviews'), where('productId', '==', productId));
        const querySnapshot = await getDocs(q);
        const reviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        return response(reviews);
    },
    create: async (review: any) => {
        const docRef = await addDoc(collection(db, 'reviews'), {
            ...review,
            createdAt: new Date().toISOString()
        });
        return response({ id: docRef.id, ...review });
    }
};

// Export a default object for backward compatibility if needed, 
// but preferably use named exports.
const api = {
    get: async (url: string) => {
        // Basic implementation for banners if needed
        if (url === '/banners') {
            const querySnapshot = await getDocs(collection(db, 'banners'));
            const banners = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return response(banners);
        }
        throw new Error(`GET ${url} not implemented in Firestore adapter`);
    },
    post: async (url: string, data: any) => {
        throw new Error(`POST ${url} not implemented in Firestore adapter`);
    },
    patch: async (url: string, data: any) => {
        throw new Error(`PATCH ${url} not implemented in Firestore adapter`);
    }
};

export default api;
