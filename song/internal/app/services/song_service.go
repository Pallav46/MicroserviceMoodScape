package services

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"
)

type SongService struct{
    httpClient *http.Client
}

func NewSongService() *SongService {
    return &SongService{
        httpClient: &http.Client{
            Timeout: 10 * time.Second,
            Transport: &http.Transport{
                MaxIdleConns:        100,
                MaxIdleConnsPerHost: 10,
                IdleConnTimeout:     90 * time.Second,
            },
        },
    }
}

func (s *SongService) SearchSongs(query string) ([]interface{}, error) {
    url := fmt.Sprintf("https://saavn.dev/api/search/songs?query=%s", query)
    resp, err := s.httpClient.Get(url)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    var data map[string]interface{}
    err = json.Unmarshal(body, &data)
    if err != nil {
        return nil, err
    }

    return []interface{}{data}, nil
}

func (s *SongService) SearchAlbums(query string) ([]interface{}, error) {
    url := fmt.Sprintf("https://saavn.dev/api/search/albums?query=%s", query)
    resp, err := s.httpClient.Get(url)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    var data map[string]interface{}
    err = json.Unmarshal(body, &data)
    if err != nil {
        return nil, err
    }

    return []interface{}{data}, nil
}

func (s *SongService) SearchArtists(query string) ([]interface{}, error) {
    url := fmt.Sprintf("https://saavn.dev/api/search/artists?query=%s", query)
    resp, err := s.httpClient.Get(url)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    var data map[string]interface{}
    err = json.Unmarshal(body, &data)
    if err != nil {
        return nil, err
    }

    return []interface{}{data}, nil
}

func (s *SongService) GeneralSearch(query string) ([]interface{}, error) {
    url := fmt.Sprintf("https://saavn.dev/api/search?query=%s", query)
    resp, err := s.httpClient.Get(url)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    var data map[string]interface{}
    err = json.Unmarshal(body, &data)
    if err != nil {
        return nil, err
    }

    return []interface{}{data}, nil
}
