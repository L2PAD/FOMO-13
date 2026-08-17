
export default (data:any) => {
    switch (data.actionType) {
        case 'projects':
            return 'projects'
        case 'nft':
            return 'nft'
        default:
            return 'news'
    }
}