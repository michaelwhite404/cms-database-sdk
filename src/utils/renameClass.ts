const renameClass = (name: string, cls: any) => ({ [name]: class extends cls {} }[name]);
export default renameClass;
