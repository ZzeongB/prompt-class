const classSample = [
    {
      name: 'Car',
      attributes: [
        { name: 'side-view', value: true },
        { name: 'color', value: false }
      ],
      relations: [{ type: 'has', target: 'Wheel' }]
    },
    {
      name: 'Wheel',
      attributes: [
        { name: 'diameter', value: false }
      ]
    }
  ];
  
  export default classSample;
  