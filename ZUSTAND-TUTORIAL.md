# Zustand no my-media-catalogue

Tutorial passo a passo usando a área do **catálogo** como estudo de caso real.
Referência: zustand `5.0.15`.

---

## Parte 0 — Qual problema estamos resolvendo

Antes de escrever qualquer store, vale olhar o que acontece hoje em `src/app/catalogue/page.tsx`.
São 10 `useState` num componente só, e três cadeias de props que existem apenas para
transportar estado de cima pra baixo:

```
Catalogue                       Catalogue                      Catalogue
  └ CatalogueControls             └ MediaList                    └ MediaForm
      └ SearchInput                   └ MediaCard                     (onRefresh)
        (setSearchTerm)                   (onDelete → loadMedias)
```

O `MediaCard` precisa recarregar a lista depois de deletar, mas ele não sabe carregar nada —
ele recebe um `onDelete` que o `MediaList` recebeu do `Catalogue` só pra repassar.
O `MediaList` não usa essa função para nada, ele é só um cano. **Isso é prop drilling**,
e é exatamente o que o Zustand elimina.

O `loadMedias` também sofre: precisa receber `(searchTerm, categoryFilter, orderBy)` como
argumentos porque quem chama está longe de quem tem os filtros. Com o store, ele vai buscar
esses valores sozinho.

> **Modelo mental:** um store Zustand é um objeto JavaScript que vive **fora** do React.
> Componentes se _inscrevem_ em pedacinhos dele. Diferente do Context, não tem `<Provider>`
> envolvendo nada, e mudar um campo só re-renderiza quem se inscreveu naquele campo específico.

---

## Passo 1 — Criar o store

`src/stores/catalogueStore.ts`:

```ts
"use client";
import { create } from "zustand";
import { MediaDocument } from "@/models/Media";

// 1. O tipo descreve o store INTEIRO: os dados e as funções que os alteram.
interface CatalogueState {
  // ---- estado: filtros ----
  searchTerm: string;
  categoryFilter: string;
  orderBy: string;

  // ---- estado: lista ----
  medias: MediaDocument[];
  loading: boolean;
  error: string | null;

  // ---- estado: modal ----
  isFormOpen: boolean;
  mediaToEdit: MediaDocument | null;

  // ---- ações ----
  setSearchTerm: (term: string) => void;
  setCategoryFilter: (category: string) => void;
  setOrderBy: (order: string) => void;
  loadMedias: () => Promise<void>;
  openCreateForm: () => void;
  openEditForm: (media: MediaDocument) => void;
  closeForm: () => void;
}

// 2. create<T>()(...) — repare nos DOIS pares de parênteses.
//    É um truque de TypeScript ("currying") que o Zustand exige para
//    conseguir inferir os tipos quando você usa middlewares depois.
//    Pegue o hábito de escrever assim desde o começo.
export const useCatalogueStore = create<CatalogueState>()((set, get) => ({
  // 3. Os valores iniciais são só propriedades do objeto.
  searchTerm: "",
  categoryFilter: "",
  orderBy: "a-z",
  medias: [],
  loading: true,
  error: null,
  isFormOpen: false,
  mediaToEdit: null,

  // 4. As ações vivem DENTRO do store, ao lado do estado que elas mudam.
  //    `set` recebe um objeto parcial e faz merge com o estado atual.
  setSearchTerm: (term) => set({ searchTerm: term }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setOrderBy: (order) => set({ orderBy: order }),

  // 5. Ações async são ações normais — nada de especial é preciso.
  //    `get()` lê o estado atual: é assim que loadMedias descobre os
  //    filtros sozinho, sem receber nada por parâmetro.
  loadMedias: async () => {
    const { searchTerm, categoryFilter, orderBy } = get();

    set({ loading: true, error: null });

    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    if (categoryFilter) params.append("category", categoryFilter);
    if (orderBy) params.append("orderby", orderBy);

    const query = params.toString();
    const url = query ? `/api/user/medias?${query}` : "/api/user/medias";

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch user medias");
      set({ medias: await res.json(), loading: false });
    } catch (error) {
      console.error("Error fetching user medias:", error);
      set({ error: "Failed to load media. Please try again.", loading: false });
    }
  },

  // 6. Uma ação pode alterar vários campos de uma vez — e é bom que altere,
  //    porque isso mantém o estado sempre coerente. "Abrir para editar"
  //    é UMA operação, não duas.
  openCreateForm: () => set({ isFormOpen: true, mediaToEdit: null }),
  openEditForm: (media) => set({ isFormOpen: true, mediaToEdit: media }),
  closeForm: () => set({ isFormOpen: false, mediaToEdit: null }),
}));
```

Três coisas para absorver aqui:

**`set` faz merge raso.** Diferente do `useState`, você não precisa espalhar o estado anterior:
`set({ loading: true })` mantém todo o resto intacto. Mas o merge é só no primeiro nível — se
você tivesse `current_episode: { season, episode }` no store,
`set({ current_episode: { season: 2 } })` apagaria o `episode`. Nesse caso use a forma de
função: `set((state) => ({ current_episode: { ...state.current_episode, season: 2 } }))`.

**Sumiu o `editMode`.** Na versão atual existem dois states, `editMode` e `mediaToEdit`, que
precisam ser mantidos em sincronia na mão. Mas `editMode` é só `mediaToEdit !== null`.
**Estado derivado não entra no store** — você calcula ele onde precisa. Um estado a menos é um
bug de dessincronização a menos.

**Sumiu a checagem de `session`.** O `loadMedias` original abortava se não houvesse sessão.
O store não conhece o NextAuth, e não deveria conhecer — quem sabe se o usuário está logado é a
página, então é ela que decide _quando_ chamar. O store só sabe _como_ buscar.

---

## Passo 2 — A regra de ouro: sempre use um seletor

O hook que o `create` devolve pode ser chamado de duas formas, e a diferença entre elas é a
coisa mais importante do Zustand:

```tsx
// ❌ Sem seletor: você se inscreve no store INTEIRO.
//    Qualquer mudança em qualquer campo re-renderiza esse componente.
const store = useCatalogueStore();

// ✅ Com seletor: você se inscreve APENAS em `medias`.
//    Digitar na busca muda `searchTerm` — e este componente nem pisca.
const medias = useCatalogueStore((state) => state.medias);
```

O seletor roda a cada mudança do store, e o Zustand compara o resultado com o anterior usando
`Object.is`. Se for igual, não re-renderiza. É por isso que **uma chamada por campo** é o padrão
idiomático:

```tsx
const loading = useCatalogueStore((state) => state.loading);
const error = useCatalogueStore((state) => state.error);
```

Parece verboso comparado a desestruturar tudo de uma vez, mas é justamente onde está o ganho de
performance. E se você quiser mesmo pegar vários campos numa chamada só, tem uma armadilha
esperando — veja a Parte 7.

---

## Passo 3 — Refatorar a página

`src/app/catalogue/page.tsx` perde 8 dos 10 `useState` e todas as props que despejava para baixo:

```tsx
"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MediaCard from "@/components/mediaCard/MediaCard";
import MediaForm from "@/components/mediaForm/MediaForm";
import { useCatalogueStore } from "@/stores/catalogueStore";

export default function Catalogue() {
  const { status } = useSession();
  const router = useRouter();

  // Um seletor por campo. `session` não é mais necessária aqui.
  const searchTerm = useCatalogueStore((state) => state.searchTerm);
  const categoryFilter = useCatalogueStore((state) => state.categoryFilter);
  const orderBy = useCatalogueStore((state) => state.orderBy);
  const loading = useCatalogueStore((state) => state.loading);
  const error = useCatalogueStore((state) => state.error);
  const isFormOpen = useCatalogueStore((state) => state.isFormOpen);
  const loadMedias = useCatalogueStore((state) => state.loadMedias);

  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    if (status !== "authenticated" && status !== "loading") {
      router.push("/login");
    }
  }, [status, router]);

  // A página observa os filtros e dispara o reload. Ela não PASSA os
  // filtros — o loadMedias lê eles do próprio store com get().
  useEffect(() => {
    if (!isAuthenticated) return;
    loadMedias();
  }, [isAuthenticated, searchTerm, categoryFilter, orderBy, loadMedias]);

  if (!isAuthenticated) return null;

  return (
    <div className="grid size-full min-h-screen grid-rows-[auto_1fr] justify-items-center gap-y-8 pt-[5.9375rem]">
      <CatalogueControls />

      {loading && <span className="loading loading-spinner loading-xl"></span>}
      {error && <p className="text-red-500">{error}</p>}

      {isFormOpen && <MediaForm />}
      {!loading && <MediaList />}
    </div>
  );
}
```

Olha o JSX: `<CatalogueControls />`, `<MediaForm />`, `<MediaList />`. **Zero props.**
Antes eram 6, 4 e 5 respectivamente.

> **Detalhe:** `loadMedias` está nas dependências do `useEffect` e isso é seguro —
> **ações do Zustand nunca mudam de identidade**. Elas são criadas uma vez, quando o store
> nasce. Você nunca vai precisar de `useCallback` para uma ação de store, e o ESLint fica feliz.
> (O `useMemo` do `isAuthenticated` também saiu: comparar duas strings é mais barato que
> memoizar.)

---

## Passo 4 — Os controles buscam o que precisam

Cada input pega **sua própria** ação, direto da fonte:

```tsx
const CatalogueControls = () => (
  <div className="bg-base-100 container mx-auto grid w-full grid-cols-[auto_1fr] items-center justify-center gap-10 rounded-2xl px-8 py-3 sm:grid-cols-[repeat(7,auto)] lg:justify-end">
    <SearchInput />
    <CategorySelect />
    <OrderBySelect />
    <AddMediaButton />
  </div>
);

const SearchInput = () => {
  const setSearchTerm = useCatalogueStore((state) => state.setSearchTerm);

  return (
    <div className="col-span-2 grid grid-cols-subgrid items-center gap-2">
      <label htmlFor="search">Search Title:</label>
      <input
        type="text"
        name="search"
        placeholder="e.g The Godfather"
        className="input"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};

const CategorySelect = () => {
  const categoryFilter = useCatalogueStore((state) => state.categoryFilter);
  const setCategoryFilter = useCatalogueStore(
    (state) => state.setCategoryFilter,
  );

  return (
    <div className="col-span-2 grid grid-cols-subgrid items-center gap-2">
      <label htmlFor="category">Category:</label>
      <select
        name="category"
        className="select"
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
      >
        <option value="">All</option>
        <option value="movie">Movies</option>
        <option value="tv show">TV Shows</option>
        <option value="anime">Anime</option>
        <option value="documentary">Documentaries</option>
      </select>
    </div>
  );
};

const AddMediaButton = () => {
  const openCreateForm = useCatalogueStore((state) => state.openCreateForm);

  return (
    <button
      onClick={openCreateForm}
      className="btn btn-primary btn-lg col-span-2 mx-auto lg:col-span-1"
    >
      Add Media
    </button>
  );
};
```

O `CatalogueControls` virou puro layout — não sabe mais nada sobre filtros. E o `SearchInput`
só pega o _setter_, sem ler o `searchTerm`: **ele nunca re-renderiza quando você digita**.
Antes, cada tecla re-renderizava a página inteira, incluindo os três controles.

Nos `select` troquei `defaultValue` por `value`, deixando eles controlados. Agora que o store é
a fonte da verdade, faz sentido o select refletir o store, e não só chutar um valor inicial.

`OrderBySelect` segue exatamente o mesmo molde do `CategorySelect`, trocando `categoryFilter`
por `orderBy`.

---

## Passo 5 — Lista e card: o que NÃO vai pro store

Essa parte é tão importante quanto o resto. A tentação, depois que você conhece Zustand,
é jogar tudo lá dentro. Não faça isso.

```tsx
const MediaList = () => {
  const medias = useCatalogueStore((state) => state.medias);

  // `expandedId` fica AQUI, como useState local. É estado de UI
  // efêmero, usado só por esta lista e pelos filhos diretos dela.
  // Passar uma prop um nível não é prop drilling — é comunicação normal.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ul className="container flex w-full flex-wrap items-start gap-x-10 gap-y-8 p-4">
      {medias.map((media) => (
        <MediaCard
          key={media._id}
          media={media}
          isExpanded={expandedId === media._id}
          onExpand={() =>
            setExpandedId((current) =>
              current === media._id ? null : (media._id ?? null),
            )
          }
        />
      ))}
    </ul>
  );
};
```

> **O critério:** vai pro store o que é compartilhado por partes distantes da árvore ou o que
> precisa sobreviver à desmontagem do componente. Fica local o que morre junto com o componente.
> `expandedId` morre com a lista → fica local.

O `MediaCard` agora tem 3 props em vez de 6, e as que restaram descrevem _aquele card
específico_ — que é exatamente o que uma prop deve fazer:

```tsx
"use client";
import Image from "next/image";
import { MediaDocument } from "@/models/Media";
import { useCatalogueStore } from "@/stores/catalogueStore";

interface MediaCardProps {
  media: MediaDocument;
  isExpanded: boolean;
  onExpand: () => void;
}

export default function MediaCard({
  media,
  isExpanded,
  onExpand,
}: MediaCardProps) {
  const openEditForm = useCatalogueStore((state) => state.openEditForm);
  const loadMedias = useCatalogueStore((state) => state.loadMedias);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/media/${media._id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete media");

      loadMedias(); // direto do store, sem callback vindo de 2 níveis acima
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  };

  return (
    <li className={/* ...igual ao que já está lá... */}>
      <MediaImage media={media} isExpanded={isExpanded} onExpand={onExpand} />
      <div className="grid max-h-[375px] grid-cols-[1fr_auto] grid-rows-[auto_auto_1fr] items-start gap-2 p-4 sm:min-w-[350px]">
        <MediaInfo media={media} />
        <CardMenu onEdit={() => openEditForm(media)} onDelete={handleDelete} />
        <MediaGenres genres={media.genres} />
        <MediaPlot plot={media.plot} />
      </div>
    </li>
  );
}
```

Sumiu a prop `index`. Antes o card recebia um índice só para devolvê-lo ao pai
(`openMediaForm(true, index)`), que então fazia `userMedias[index]` para achar o objeto que o
card **já tinha em mãos**. Com o store, o card simplesmente entrega o objeto:
`openEditForm(media)`.

---

## Passo 6 — O formulário: store e estado local convivendo

O `MediaForm` tem uns 10 `useState` também, mas eles são **estado de formulário** — `title`,
`plot`, `genres`... Eles nascem quando o modal abre e morrem quando ele fecha.
**Não vão pro store.** Só as 4 props é que vão:

```tsx
export default function MediaForm() {
  const mediaToEdit = useCatalogueStore((state) => state.mediaToEdit);
  const closeForm = useCatalogueStore((state) => state.closeForm);
  const loadMedias = useCatalogueStore((state) => state.loadMedias);

  // Derivado, não armazenado.
  const editMode = mediaToEdit !== null;

  // Todo o resto continua exatamente como está: useState local,
  // inicializado a partir do mediaToEdit que veio do store.
  const [title, setTitle] = useState<string>(mediaToEdit?.title || "");
  const [image, setImage] = useState<string | null>(mediaToEdit?.image || null);
  // ...
}
```

Dentro do `submitMedia`, as duas chamadas de callback viram chamadas de store:

| antes         | depois         |
| ------------- | -------------- |
| `onRefresh()` | `loadMedias()` |
| `onClose()`   | `closeForm()`  |

Isso funciona porque o `MediaForm` só é montado quando `isFormOpen` é `true` — então na
montagem o `mediaToEdit` já está no store, e os `useState` inicializam certo.

No JSX é só trocar `onClick={onClose}` por `onClick={closeForm}`, e a interface
`MediaFormProps` inteira pode ser deletada.

---

## Parte 7 — As armadilhas

### 1. O seletor que devolve um objeto novo

Essa é _a_ pegadinha do Zustand v5:

```tsx
// ❌ Cria um objeto novo a cada execução. O Object.is nunca dá igual,
//    o React entende que o snapshot mudou infinitamente e você toma um
//    "The result of getSnapshot should be cached" + loop de render.
const { searchTerm, orderBy } = useCatalogueStore((state) => ({
  searchTerm: state.searchTerm,
  orderBy: state.orderBy,
}));

// ✅ useShallow compara campo a campo em vez de comparar a referência.
import { useShallow } from "zustand/react/shallow";

const { searchTerm, orderBy } = useCatalogueStore(
  useShallow((state) => ({
    searchTerm: state.searchTerm,
    orderBy: state.orderBy,
  })),
);
```

Na v4 isso "só" causava re-renders demais; na v5 virou um erro barulhento. Enquanto você usar
um seletor por campo, o problema nem aparece.

### 2. Ler sem se inscrever

Fora de um componente — ou dentro dele, quando você quer só o valor atual sem virar assinante —
use `getState()`:

```tsx
const filtros = useCatalogueStore.getState(); // lê uma vez, sem re-render
useCatalogueStore.setState({ searchTerm: "" }); // escreve de fora do React
useCatalogueStore.getState().loadMedias(); // chama uma ação de qualquer lugar
```

Ótimo dentro de handlers e utilitários. Só não use `getState()` no corpo do render esperando
reatividade — ali ele lê o valor e para por aí.

### 3. Next.js: o store é um singleton de módulo

Ele é criado uma vez por processo. No cliente isso é o que você quer. No servidor, um store de
módulo seria compartilhado entre _todas_ as requisições, então: **qualquer arquivo que use o
hook precisa estar dentro do boundary `"use client"`**. Por isso o `"use client"` no topo do
`MediaCard` no Passo 5 — hoje ele funciona por herdar do pai, mas é frágil depender disso.

Se um dia você precisar de estado inicializado no servidor por requisição, o padrão é criar o
store dentro de um Provider com `useRef`. Para o catálogo, que é client-side e atrás de login,
o singleton é o certo.

### 4. O store não zera sozinho no logout

Como ele vive fora do React, trocar de usuário não limpa as mídias. Uma ação
`reset: () => set({ medias: [], searchTerm: "", ... })` chamada no logout resolve, se um dia
isso incomodar.

---

## Parte 8 — Middlewares

Middlewares embrulham o store e adicionam comportamento. Dois valem muito a pena aqui.

### `persist` — salvar a preferência de ordenação entre visitas

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCatalogueStore = create<CatalogueState>()(
  persist(
    (set, get) => ({
      /* ...exatamente o mesmo objeto do Passo 1... */
    }),
    {
      name: "catalogue-prefs", // chave no localStorage
      // partialize escolhe o que salvar. Sem ele, a lista inteira de
      // mídias iria pro localStorage — o que você NÃO quer, porque
      // ela é dado de servidor, não preferência do usuário.
      partialize: (state) => ({
        orderBy: state.orderBy,
        categoryFilter: state.categoryFilter,
      }),
    },
  ),
);
```

Aviso honesto: no Next.js isso pode gerar warning de hydration mismatch, porque o HTML do
servidor usa `"a-z"` e o cliente lê outro valor do `localStorage` logo em seguida. Se incomodar,
`skipHydration: true` nas opções + `useCatalogueStore.persist.rehydrate()` dentro de um
`useEffect` na página resolvem.

### `devtools` — inspecionar o store na extensão Redux DevTools

```ts
import { devtools, persist } from "zustand/middleware";

export const useCatalogueStore = create<CatalogueState>()(
  devtools(
    // devtools SEMPRE por fora
    persist(
      (set, get) => ({
        // o 3º argumento do set vira o nome da ação no DevTools
        setOrderBy: (order) => set({ orderBy: order }, undefined, "setOrderBy"),
        // ...
      }),
      { name: "catalogue-prefs" },
    ),
    { name: "CatalogueStore" },
  ),
);
```

Pra aprender, o `devtools` é o mais valioso dos dois: você vê cada ação disparando e o estado
mudando em tempo real, o que torna tudo isso muito menos abstrato.

---

## Apêndice — Lendo a assinatura `setSearchTerm: (term: string) => void;`

Essa linha da interface confunde bastante quem está começando em TypeScript, porque ela
_parece_ uma função mas não é. Anatomia:

```
setSearchTerm: (term: string) => void;
│              │     │           │
│              │     │           └─ não devolve nada
│              │     └───────────── tipo do parâmetro
│              └─────────────────── nome do parâmetro (só documentação)
└────────────────────────────────── nome da propriedade no store
```

**Isso é um tipo, não uma implementação.** A interface inteira é uma descrição do formato do
objeto, e essa linha diz: _"vai existir uma propriedade chamada `setSearchTerm`, e o valor dela
vai ser uma função que recebe uma string e não devolve nada"_.

Compare com a linha de estado logo acima dela:

```ts
searchTerm: string;                    // o valor É uma string
setSearchTerm: (term: string) => void; // o valor É uma função
```

Nas duas o padrão é o mesmo: `nome: tipo`. O que muda é que no segundo caso o tipo por acaso é
um tipo de função. Num store Zustand, dados e ações moram na mesma interface porque o store é
**um único objeto** que contém os dois.

### O nome `term` não importa

Ele é puramente descritivo. Estas três declarações são idênticas para o TypeScript:

```ts
setSearchTerm: (term: string) => void;
setSearchTerm: (x: string) => void;
setSearchTerm: (qualquerCoisa: string) => void;
```

Mas o TS **exige** um nome ali — `(string) => void` seria interpretado como "um parâmetro
chamado `string` de tipo `any`", que é um erro clássico. Então escolha um nome que documente
bem, porque ele é o que aparece no autocomplete do editor.

### `void` significa "ignore o retorno"

Não é bem "retorna `undefined`" — é "o retorno não interessa". Na prática o TS até deixa você
atribuir a um tipo `void` uma função que devolve algo. Você chama pelo efeito colateral (mudar
o store), não pelo valor:

```ts
setSearchTerm: (term) => set({ searchTerm: term }),
```

### O que essa linha te dá na prática

Ela é o contrato que faz o resto funcionar sem você anotar mais nada:

```ts
// Na implementação, `term` NÃO tem anotação de tipo:
setSearchTerm: (term) => set({ searchTerm: term }),
//              ^^^^ o TS já sabe que é string, por causa do create<CatalogueState>()
```

Isso se chama **contextual typing**: o `create<CatalogueState>()` diz ao TS qual formato
esperar, então ele infere o tipo do parâmetro sozinho. Sem a interface, `term` seria
implicitamente `any` e você perderia toda a checagem.

E no componente:

```tsx
const setSearchTerm = useCatalogueStore((state) => state.setSearchTerm);

setSearchTerm(e.target.value); // ✅
setSearchTerm(123); // ❌ Argument of type 'number' is not assignable to 'string'
setSearchTerm(); // ❌ Expected 1 arguments, but got 0
```

### As variações que aparecem na mesma interface

```ts
openCreateForm: () => void;                   // sem parâmetro, sem retorno
openEditForm: (media: MediaDocument) => void; // parâmetro é um objeto tipado
loadMedias: () => Promise<void>;              // async → devolve Promise
```

O `loadMedias` é `Promise<void>` justamente porque ele é `async`. Toda função `async` devolve
uma Promise, mesmo que o corpo dela não tenha `return` — e `Promise<void>` é "uma promessa que,
quando resolver, não traz valor nenhum junto". É isso que te permite escrever
`await loadMedias()` se algum dia precisar esperar a lista chegar.

### Nota de rodapé: as duas sintaxes

Você vai ver as duas formas por aí, e nesse contexto elas são equivalentes:

```ts
setSearchTerm: (term: string) => void;  // propriedade cujo valor é função (a que usamos)
setSearchTerm(term: string): void;      // sintaxe de método
```

A diferença só aparece em casos avançados de variância de parâmetros com `strictFunctionTypes`
— a primeira é checada de forma mais estrita. Para stores, use a primeira e não pense mais
nisso.

---

## Resumo do que fazer

1. Criar `src/stores/catalogueStore.ts` (Passo 1).
2. Enxugar `src/app/catalogue/page.tsx` e os subcomponentes de controle (Passos 3 e 4).
3. Enxugar `src/components/mediaCard/MediaCard.tsx` e o `MediaList` (Passo 5).
4. Trocar as 4 props do `src/components/mediaForm/MediaForm.tsx` por seletores, mantendo o
   estado de formulário local (Passo 6).

O placar: ~20 props deixam de existir, `MediaList` para de ser um cano de callbacks,
`loadMedias` para de receber argumentos, e digitar na busca deixa de re-renderizar a página
inteira.

**Teste de que entendeu:** abra o React DevTools, marque "Highlight updates" e digite na busca —
só o `MediaList` deve piscar.
