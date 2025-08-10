const names = ['Henryk', 'Heinrich', 'Henricus', 'Henri', 'Henry', 'Enrique', 'Enrico', 'Enric', 
    'Henrique', 'Henrik', 'Hendrik', 'Hinrik', 'Henrikh', 'Henrijs', 'Henriks', 'Henrikas', 
    'Herkus', 'Jindřich', 'Henrich', 'Anraí', 'Éinrí', 'Eanraig', 'Eanruig', 'Endika', 'Indrek', 
    'Indriķis', 'Heikki', 'Herri', 'Genrich', 'Генрих', 'Генрых', 'Anri', 'Errikos', 
    'Հենրիկ', '亨利', '헨리', 'हेनरी', 'هنري', 'הנרי'];
const approximate = ['hen', 'hein', 'enri', 'haim', 'hain', 'anra', 'eanr', 'indr', 'herr', 'heik', 'harr', 'erri' ];
const false_names = ['Heinzmann', 'Schenk', 'Teschen', 'Dovzhenko', 'Henna', 'Henckel', 'Chain', 
    'Cheney', 'Harrison', 'Zheng', 'Cohen', 'Enright', 'Gerritsen', 'Terrible', 'Cheng', 
    'Stephen', 'Sheng', 'Hermann', 'Freiherr'];

export class NameMatcher
{
    constructor()
    {
        this.approximate_pattern = new RegExp(`(${approximate.join('|')})`, 'i');
        this.names = new Set(names.map(name => name.toLowerCase()));
        this.false_names_pattern = new RegExp(`(${false_names.join('|')})`, 'i');
    }

    /**
     * @param {string} name
     * @returns {'exact' | 'approximate' | undefined}
     */
    match(name)
    {
        const words = name.split(' ');
        for (const word of words)
        {
            if (word && this.names.has(word.toLowerCase()))
                return 'exact';
            if (this.approximate_pattern.test(word.replace(this.false_names_pattern, '')))
                return 'approximate';
        }
    }
}