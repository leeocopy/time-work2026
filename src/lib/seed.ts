import { supabase } from '@/Supabase/supabase';
import quotesData from './quotes.json';

export const seedQuotes = async () => {
    const { count } = await supabase.from('quotes').select('*', { count: 'exact', head: true });

    if (count === 0) {
        console.log('Seeding quotes...');
        const { error } = await supabase.from('quotes').insert(
            quotesData.map(q => ({ text: q.text, author: q.author }))
        );
        if (error) console.error('Error seeding quotes:', error);
        else console.log('Quotes seeded successfully!');
    }
};
