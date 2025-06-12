// const classSample = [
//     {
//       name: 'Car',
//       attributes: [
//         { name: 'side-view', value: true },
//         { name: 'color', value: false }
//       ],
//       relations: [{ type: 'has', target: 'Wheel' }]
//     },
//     {
//       name: 'Wheel',
//       attributes: [
//         { name: 'diameter', value: false }
//       ]
//     }
//   ];

// export { classSample };

export type Attribute = { name: string; value: string | null }; // value === false: 빈값
export type Relation = { type: string; source: string; target: string };

export type ObjectClass = {
  type: "object-class";
  name: string;
  objects: {
    name: string;
    attributes: Attribute[];
  }[];
  relations?: Relation[];
};

export type AttributeClass = {
  type: "attribute-class";
  name: string;
};

export type RelationClass = {
  type: "relation-class";
  name: string;
};

export type AnyClass = ObjectClass | AttributeClass | RelationClass;

export const classSample: AnyClass[] = [
  {
    type: "object-class",
    name: "Monroe",
    objects: [
      { name: "face", attributes: [{ name: "color", value: null }] },
      { name: "eye shadow", attributes: [{ name: "color", value: null }] },
      { name: "hair", attributes: [{ name: "color", value: null }] },
    ],
  },
  {
    type: "object-class",
    name: "Mole",
    objects: [
      { name: "mole", attributes: [{ name: "color", value: "black" }] },
      { name: "glasses", attributes: [{ name: "size", value: "small" }] },
    ],
    relations: [{ type: "wearing", source: "mole", target: "glasses" }],
  },
];
